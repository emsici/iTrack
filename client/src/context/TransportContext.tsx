import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CapacitorGeoService, requestGpsPermissions } from '@/lib/capacitorService';
import { getCurrentPosition, setGpsAccessControl } from "@/lib/transportService";
import { sendGpsUpdate } from "@/lib/gpsService";
import { startBackgroundLocationTracking, stopBackgroundLocationTracking, isBackgroundServiceActive } from "@/lib/backgroundService";
import { setupConnectivityListeners, syncOfflineData, checkGpsAvailability } from "@/lib/connectivityService";

// Tipuri de status pentru transport
type TransportStatus = "inactive" | "active" | "paused" | "finished";

// Structura pentru coordonatele GPS
interface GpsCoordinates {
  lat: number;
  lng: number;
  timestamp: string;
  viteza: number;
  directie: number;
  altitudine: number;
  baterie: number;
}

// Interfață pentru un UIT (transport)
export interface UitOption {
  uit: string;
  start_locatie: string;
  stop_locatie: string;
}

// Informații despre transportul activ specific unui vehicul
interface VehicleTransport {
  vehicleNumber: string;
  uit: string;
  status: TransportStatus;
  lastPosition: GpsCoordinates | null;
  startTime: string;
  lastUpdateTime: string;
  isGpsActive: boolean;
  isBackgroundActive: boolean;
}

// Tipul contextului pentru transport
interface TransportContextType {
  // Starea curentă a transportului vizualizat
  transportStatus: TransportStatus;
  gpsCoordinates: GpsCoordinates | null;
  selectedUits: UitOption[];
  setSelectedUits: (uits: UitOption[]) => void;
  currentActiveUit: UitOption | null;
  setCurrentActiveUit: (uit: UitOption | null) => void;
  
  // Funcții pentru transportul curent
  startTransport: () => Promise<boolean>;
  pauseTransport: () => Promise<void>;
  resumeTransport: () => Promise<void>;
  finishTransport: () => Promise<void>;
  
  // Utilizat pentru afișare în UI
  isGpsActive: boolean;
  lastGpsUpdateTime: string | null;
  battery: number;
  isBackgroundActive: boolean;
  
  // Informații despre vehiculul curent
  currentVehicle: string | null;
  
  // Funcționalități pentru gestionarea mai multor transporturi
  getAllVehicleTransports: () => VehicleTransport[];
  getVehicleTransport: (vehicleNumber: string) => VehicleTransport | undefined;
}

// Creăm contextul
const TransportContext = createContext<TransportContextType | undefined>(undefined);

// Provider-ul pentru context
export function TransportProvider({ children }: { children: ReactNode }) {
  // State pentru transport
  const [transportStatus, setTransportStatus] = useState<TransportStatus>("inactive");
  
  // Referință pentru a urmări starea curentă a transportului în cadrul callback-urilor
  const transportStatusRef = useRef<TransportStatus>("inactive");
  
  // State pentru GPS și transport
  const [gpsCoordinates, setGpsCoordinates] = useState<GpsCoordinates | null>(null);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [lastGpsUpdateTime, setLastGpsUpdateTime] = useState<string | null>(null);
  const [battery, setBattery] = useState<number>(100);
  const [isBackgroundActive, setIsBackgroundActive] = useState<boolean>(false);
  
  // State pentru UIT-uri
  const [selectedUits, setSelectedUits] = useState<UitOption[]>([]);
  const [currentActiveUit, setCurrentActiveUit] = useState<UitOption | null>(null);
  
  // State pentru vehiculul curent și registrul de transporturi
  const [currentVehicle, setCurrentVehicle] = useState<string | null>(null);
  const [vehicleTransports, setVehicleTransports] = useState<VehicleTransport[]>([]);
  
  // Referințe pentru timer și watcher
  const gpsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const watchPositionRef = useRef<{ clearWatch: () => void } | null>(null);
  const notificationSentRef = useRef<boolean>(false);
  
  // Accesăm autentificarea și toast
  const { token, vehicleInfo, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Referință la starea de inițializare 
  const initializedRef = useRef(false);
  
  // Actualizăm referința ori de câte ori se modifică statusul transportului
  useEffect(() => {
    transportStatusRef.current = transportStatus;
    
    // Actualizăm controlul de acces GPS cu starea curentă de autentificare și transport
    const isTransportActive = transportStatus === "active";
    setGpsAccessControl(isAuthenticated, isTransportActive);
    console.log(`Control acces GPS actualizat: Auth=${isAuthenticated}, Transport=${isTransportActive}`);
  }, [transportStatus, isAuthenticated]);
  
  // Oprire tracking GPS - definit înainte pentru a fi folosit de alte funcții
  const stopGpsTracking = useCallback(() => {
    console.log("Stop tracking GPS");
    
    // Oprim timer-ul pentru trimiterea datelor
    if (gpsTimerRef.current) {
      clearInterval(gpsTimerRef.current);
      gpsTimerRef.current = null;
    }
    
    // Oprim urmărirea poziției
    if (watchPositionRef.current) {
      watchPositionRef.current.clearWatch();
      watchPositionRef.current = null;
    }
    
    // Marcăm GPS-ul ca inactiv
    setIsGpsActive(false);
    
    // Actualizăm controlul de acces GPS pentru a bloca accesul
    setGpsAccessControl(isAuthenticated, false);
    
    return true;
  }, [isAuthenticated]);
  
  // Urmărirea poziției în timp real
  const startWatchPosition = useCallback(async () => {
    console.log("Start watch position pentru actualizări UI în timp real");
    
    try {
      // Solicităm permisiuni pentru geolocație
      await CapacitorGeoService.requestPermissions();
      
      // Oprim orice watching existent
      if (watchPositionRef.current) {
        watchPositionRef.current.clearWatch();
        watchPositionRef.current = null;
      }
      
      // Pornește un nou watch - primim rezultatul
      const watchHandler = await CapacitorGeoService.watchPosition((position) => {
        // Actualizăm UI-ul cu noile coordonate
        const { latitude, longitude, altitude, speed, heading } = position.coords;
        const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
        
        // Actualizare state cu noile coordonate
        setGpsCoordinates(prev => {
          const speedKmh = speed ? speed * 3.6 : 0;
          
          // Dacă nu avem coordonate anterioare, creăm un nou obiect
          if (!prev) {
            return {
              lat: latitude,
              lng: longitude,
              timestamp,
              viteza: speedKmh,
              directie: heading || 0,
              altitudine: altitude || 0,
              baterie: battery
            };
          }
          
          // Altfel, actualizăm coordonatele existente
          return {
            ...prev,
            lat: latitude,
            lng: longitude,
            timestamp,
            viteza: speedKmh,
            directie: heading || 0,
            altitudine: altitude || 0
          };
        });
        
        // Actualizăm timpul ultimei actualizări
        setLastGpsUpdateTime(timestamp);
        
        // GPS se consideră activ DOAR dacă transportul este activ ȘI avem coordonate valide
        if (transportStatus === "active" && latitude && longitude) {
          console.log("GPS disponibil, poziție obținută:", { lat: latitude, lng: longitude });
          setIsGpsActive(true);
        } else {
          // Nu setăm explicit la false aici deoarece s-ar putea să avem un transport activ care așteaptă coordonate
          console.log("Coordonate GPS disponibile, dar transport inactiv:", transportStatus);
        }
      }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      
      // Salvăm referința pentru a putea opri watching-ul mai târziu
      if (watchHandler) {
        watchPositionRef.current = { 
          clearWatch: () => {
            if (watchHandler.clearWatch) {
              watchHandler.clearWatch();
            }
          } 
        };
      }
      
      return true;
    } catch (error) {
      console.error("Eroare la pornirea watchPosition:", error);
      return false;
    }
  }, [battery, transportStatus]);
  
  // Trimiterea coordonatelor GPS la un interval regulat
  const startGpsTracking = useCallback(async () => {
    try {
      if (!vehicleInfo || !token || !currentActiveUit) {
        console.error("Lipsesc informații necesare pentru tracking GPS");
        return false;
      }
      
      // Actualizăm controlul de acces GPS pentru a permite citirea coordonatelor
      setGpsAccessControl(true, true);
      console.log("Control acces GPS activat pentru tracking");
      
      // Pornește watchPosition pentru actualizări UI dacă nu rulează deja
      if (!watchPositionRef.current) {
        const started = await startWatchPosition();
        if (!started) {
          console.error("Nu s-a putut porni watchPosition");
          return false;
        }
      }
      
      // Verifică dacă timer-ul există deja
      if (gpsTimerRef.current) {
        clearInterval(gpsTimerRef.current);
      }
      
      // Trimite coordonatele GPS la un interval regulat (45 secunde)
      const interval = 45 * 1000; // 45 secunde
      
      // Actualizăm starea GPS imediat la ACTIV
      // Acest lucru este crucial pentru UI
      console.log("Setare GPS activ în startGpsTracking");
      setIsGpsActive(true);
      
      // Inițial trimitem o poziție manual
      try {
        // Obține poziția curentă
        const position = await getCurrentPosition();
        
        // Trimite datele către server doar dacă transportul este activ
        if (transportStatusRef.current === "active") {
          await sendGpsUpdate(position, {
            nr: vehicleInfo.nr,
            uit: currentActiveUit.uit
          }, token, "in_progress");
          console.log("Poziție GPS inițială trimisă");
        }
      } catch (error) {
        console.error("Eroare la trimiterea poziției inițiale:", error);
        // Continuăm oricum, poate următoarea poziție va fi trimisă cu succes
      }
      
      // Setăm timer-ul pentru trimitere periodică
      gpsTimerRef.current = setInterval(async () => {
        try {
          // Verificăm starea transportului de fiecare dată când trimitem date
          // Folosim referința pentru a evita probleme de closure cu valori vechi
          if (transportStatusRef.current !== "active") {
            console.log("Tracking oprit automat - transportul nu mai este activ");
            stopGpsTracking();
            return;
          }
          
          // Obține poziția curentă
          const position = await getCurrentPosition();
          
          // Trimite datele către server
          await sendGpsUpdate(position, {
            nr: vehicleInfo.nr,
            uit: currentActiveUit.uit
          }, token, "in_progress");
          
          console.log("Poziție GPS trimisă");
          
          // Verifică și sincronizează datele offline dacă există
          await syncOfflineData(token);
        } catch (error) {
          console.error("Eroare la trimiterea coordonatelor GPS:", error);
        }
      }, interval);
      
      return true;
    } catch (error) {
      console.error("Eroare la pornirea tracking-ului GPS:", error);
      return false;
    }
  }, [vehicleInfo, token, currentActiveUit, startWatchPosition, stopGpsTracking]);
  
  // Funcții pentru salvarea și restaurarea stării transportului în localStorage
  const saveTransportState = useCallback(() => {
    if (!isAuthenticated || !vehicleInfo?.nr) return;
    
    try {
      // Pentru stările inactive, ștergem starea din localStorage pentru a preveni salvarea greșită
      if (transportStatus === "inactive" || transportStatus === "finished") {
        localStorage.removeItem(`transport_state_${vehicleInfo.nr}`);
        console.log("Stare inactivă - șters starea transportului din localStorage");
        return;
      }
      
      // Salvăm starea curentă doar dacă este active sau paused
      // Acest lucru asigură persistența stării între navigări
      const stateToSave = {
        transportStatus,
        currentActiveUit,
        lastGpsUpdateTime,
        battery,
        timestamp: new Date().getTime()
      };
      
      localStorage.setItem(`transport_state_${vehicleInfo.nr}`, JSON.stringify(stateToSave));
      console.log("Stare transport salvată în localStorage:", transportStatus);
    } catch (error) {
      console.error("Eroare la salvarea stării transportului:", error);
    }
  }, [transportStatus, currentActiveUit, lastGpsUpdateTime, battery, isAuthenticated, vehicleInfo]);
  
  // Funcție pentru restaurarea stării transportului din localStorage
  const restoreTransportState = useCallback(() => {
    if (!isAuthenticated || !vehicleInfo?.nr) return false;
    
    try {
      const savedState = localStorage.getItem(`transport_state_${vehicleInfo.nr}`);
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        // Verificăm dacă starea salvată nu este mai veche de 24 de ore
        const now = new Date().getTime();
        const savedTime = parsedState.timestamp || 0;
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (now - savedTime > oneDay) {
          console.log("Stare transport prea veche, nu o restaurăm");
          localStorage.removeItem(`transport_state_${vehicleInfo.nr}`);
          return false;
        }
        
        // Restaurăm starea doar dacă este "active" sau "paused"
        const storedStatus = parsedState.transportStatus || "inactive";
        
        // Chiar dacă starea este "inactive", verificăm dacă avem o sesiune activă în registru
        // Aceasta ne permite să menținem sesiunile active între navigări
        const activeTransport = vehicleTransports.find(t => 
          t.vehicleNumber === vehicleInfo.nr && 
          (t.status === "active" || t.status === "paused")
        );
        
        // Dacă avem o sesiune activă în registru, o folosim pe aceea
        const finalStatus = activeTransport ? activeTransport.status : storedStatus;
        
        if (finalStatus === "active" || finalStatus === "paused") {
          // Restaurăm starea
          if (parsedState.currentActiveUit) setCurrentActiveUit(parsedState.currentActiveUit);
          if (parsedState.lastGpsUpdateTime) setLastGpsUpdateTime(parsedState.lastGpsUpdateTime);
          if (parsedState.battery) setBattery(parsedState.battery);
          
          // NU setăm GPS-ul ca activ automat aici
          // Vom lăsa startWatchPosition să actualizeze acest flag
          // când va obține cu succes coordonate GPS
          // GPS-ul va fi marcat ca activ doar când confirmăm că avem coordonate reale
          console.log("Restaurare transport - așteptăm coordonate GPS pentru activare indicator");
          
          // Setăm transportStatus la final pentru a declanșa efectele care depind de el
          setTransportStatus(finalStatus);
          
          console.log("Stare transport restaurată:", finalStatus);
          return true;
        } else {
          console.log("Nu restaurăm starea 'inactive' din localStorage");
          return false;
        }
      }
    } catch (error) {
      console.error("Eroare la restaurarea stării transportului:", error);
    }
    
    return false;
  }, [isAuthenticated, vehicleInfo, vehicleTransports]);
  
  // Salvăm starea transportului de fiecare dată când se modifică
  useEffect(() => {
    saveTransportState();
  }, [transportStatus, currentActiveUit, lastGpsUpdateTime, battery, saveTransportState]);

  // Inițializare GPS condiționată de starea transportului și autentificării
  useEffect(() => {
    // Prevenim reinițializări multiple care pot cauza buclă infinită
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    
    console.log("Inițializare GPS automată la pornire");
    
    // Verificare pentru sesiune existentă
    console.log("Verificare sesiune existentă la pornirea aplicației");
    const stateRestored = restoreTransportState();
    
    // Dacă starea a fost restaurată ca "active", actualizăm starea UI fără a reporni tracking-ul
    if (stateRestored && transportStatus === "active") {
      console.log("Sesiune găsită, restaurez starea transportului - NU repornesc tracking GPS");
      // Nu repornin tracking-ul GPS deoarece acesta deja rulează în background
      setIsGpsActive(true); // Doar actualizăm starea UI
    }
    
    const initGps = async () => {
      // Verificăm dacă avem un transport activ - doar atunci inițializăm GPS-ul complet
      const shouldStartGps = transportStatus === "active";
      
      try {
        // NU solicităm permisiuni GPS în acest moment
        // Le vom solicita DOAR atunci când utilizatorul pornește o cursă
        
        // Verifică disponibilitatea GPS-ului inițial - fără să solicite permisiuni
        const isGpsAvailable = await checkGpsAvailability();
        console.log("Disponibilitate GPS inițială:", isGpsAvailable ? "Disponibil" : "Indisponibil");
        
        if (shouldStartGps) {
          console.log("Verificare GPS - StatusAuth:", isAuthenticated, "StatusTransport:", transportStatus);
          
          // Pornire tracking GPS pentru transport activ
          if (isAuthenticated && transportStatus === "active") {
            console.log("Acces GPS autorizat - citire coordonate");
            
            // Pornește watchPosition pentru a obține actualizări de poziție
            await startWatchPosition();
            
            // Doar dacă suntem autentificați și avem un transport activ,
            // pornim tracking-ul complet cu trimitere periodică de coordonate
            await startGpsTracking();
          }
        }
      } catch (error) {
        console.error("Eroare la inițializarea GPS-ului:", error);
      }
    };
    
    // Inițializează GPS doar când utilizatorul este autentificat
    if (isAuthenticated) {
      console.log("Utilizator autentificat, inițializare GPS");
      initGps();
    } else {
      console.log("GPS neactivat - utilizator neautentificat");
    }
    
    // Configurăm listeners pentru conectivitate
    console.log("Inițializare monitorizare conectivitate");
    const cleanup = setupConnectivityListeners(
      // Callback pentru când conexiunea este restaurată
      async () => {
        console.log("Conexiune restaurată, sincronizez date offline");
        
        // Verificăm dacă avem token pentru a sincroniza date
        if (token) {
          await syncOfflineData(token);
        } else {
          console.warn("Nu se pot sincroniza datele offline - token lipsă");
        }
      }
    );
    
    // Cleanup la unmount
    return () => {
      console.log("Cleanup monitorizare conectivitate");
      cleanup();
      stopGpsTracking();
    };
  }, [
    transportStatus, isAuthenticated, token, restoreTransportState, 
    startWatchPosition, startGpsTracking, stopGpsTracking
  ]);
  
  // Repornire automată a tracking-ului la încărcarea componentei dacă starea este activă
  useEffect(() => {
    // Evităm repornirea multiplă prin verificarea referinței
    if (initializedRef.current) return;
    
    // Verificăm dacă transportul este activ la încărcarea componentei
    if (transportStatus === "active" && isAuthenticated && token) {
      console.log("Restaurare automată a tracking-ului GPS - transport activ");
      initializedRef.current = true;
      
      // Pornim urmărirea poziției după un scurt delay pentru a permite componentei să se inițializeze complet
      setTimeout(() => {
        startWatchPosition().then(success => {
          console.log("Tracking GPS pornit automat la încărcarea componentei:", success ? "SUCCES" : "EȘUAT");
          // Dacă startWatchPosition a reușit, va seta isGpsActive la true doar când sunt disponibile coordonate
          // NU setăm isGpsActive aici pentru a evita afișarea prematură a stării active
        }).catch(error => {
          console.error("Eroare la pornirea automată a tracking-ului GPS:", error);
        });
      }, 300);
    }
  }, [transportStatus, isAuthenticated, token, startWatchPosition]);
  
  // Inițializare UIT-uri la încărcarea componentei dacă există informații despre vehicul
  useEffect(() => {
    if (vehicleInfo && vehicleInfo.uit && (selectedUits.length === 0 || !currentActiveUit)) {
      // Creăm UIT-ul implicit
      const newUit: UitOption = {
        uit: vehicleInfo.uit,
        start_locatie: vehicleInfo.start_locatie || "",
        stop_locatie: vehicleInfo.stop_locatie || ""
      };
      
      // Setăm UIT-ul doar dacă nu există deja
      if (selectedUits.length === 0) {
        setSelectedUits([newUit]);
        console.log("UIT adăugat pentru vehiculul nou:", newUit);
      }
      
      // Setăm UIT-ul activ dacă nu există deja
      if (!currentActiveUit) {
        setCurrentActiveUit(newUit);
      }
      
      // Adăugăm vehiculul la registrul de transporturi dacă nu există deja
      if (vehicleInfo.nr && !currentVehicle) {
        setCurrentVehicle(vehicleInfo.nr);
        
        // Verificăm dacă există deja în registru
        const existingTransport = vehicleTransports.find(t => t.vehicleNumber === vehicleInfo.nr);
        if (!existingTransport) {
          setVehicleTransports(prev => [...prev, {
            vehicleNumber: vehicleInfo.nr,
            uit: vehicleInfo.uit,
            status: transportStatus,
            lastPosition: gpsCoordinates,
            startTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
            lastUpdateTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
            isGpsActive,
            isBackgroundActive
          }]);
        }
      }
    }
  }, [vehicleInfo, selectedUits, currentActiveUit, vehicleTransports, transportStatus, gpsCoordinates, isGpsActive, isBackgroundActive, currentVehicle]);
  
  // Pornire transport
  const startTransport = async (): Promise<boolean> => {
    console.log("Pornire transport - Verificare condiții");
    
    try {
      // Verificăm dacă avem toate informațiile necesare
      if (!vehicleInfo || !token || !currentActiveUit) {
        console.error("Lipsesc date necesare pentru pornirea transportului");
        
        toast({
          variant: "destructive",
          title: "Eroare",
          description: "Lipsesc date necesare pentru pornirea transportului.",
        });
        
        return false;
      }
      
      // Verificăm dacă transportul este deja activ
      if (transportStatus === "active") {
        console.log("Transportul este deja activ");
        
        toast({
          title: "Transport activ",
          description: "Transportul este deja în desfășurare.",
        });
        
        return true;
      }
      
      // Solicităm permisiunile GPS ÎNAINTE de a schimba starea transportului
      // Acest lucru previne blocarea UI-ului în cazul eșecului permisiunilor GPS
      console.log("Verificare permisiuni GPS înainte de pornirea transportului");
      try {
        // Adăugăm un timeout pentru a preveni blocarea aplicației la solicitarea permisiunilor
        const permissionPromise = requestGpsPermissions();
        const timeoutPromise = new Promise<boolean>(resolve => {
          setTimeout(() => {
            console.log("Timeout la solicitarea permisiunilor GPS, continuăm");
            resolve(true);
          }, 5000); // 5 secunde timeout
        });
        
        // Așteptăm care dintre promisiuni se rezolvă prima
        const permissionsGranted = await Promise.race([permissionPromise, timeoutPromise]);
        
        console.log("Rezultat solicitare permisiuni GPS:", permissionsGranted ? "Acordate" : "Refuzate");
        
        // Chiar dacă permisiunile nu sunt acordate, continuăm, dar afișăm un avertisment
        if (!permissionsGranted) {
          toast({
            title: "Atenție",
            description: "Permisiunile GPS sunt necesare pentru urmărirea transportului.",
          });
        }
      } catch (permError) {
        console.error("Eroare la verificarea permisiunilor GPS:", permError);
        // Continuăm și în caz de eroare, dar logăm problema
      }
      
      // Schimbăm starea transportului
      setTransportStatus("active");
      
      // Actualizăm registrul de transporturi
      if (vehicleInfo && vehicleInfo.nr) {
        setVehicleTransports(prev => {
          const existingIndex = prev.findIndex(t => t.vehicleNumber === vehicleInfo.nr);
          if (existingIndex >= 0) {
            const updatedTransports = [...prev];
            updatedTransports[existingIndex] = {
              ...updatedTransports[existingIndex],
              status: "active",
              isGpsActive: true,
              startTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
              lastUpdateTime: new Date().toISOString().replace('T', ' ').substr(0, 19)
            };
            return updatedTransports;
          } else {
            // Adăugăm un nou transport în registru
            return [...prev, {
              vehicleNumber: vehicleInfo.nr,
              uit: currentActiveUit.uit,
              status: "active",
              lastPosition: null,
              startTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
              lastUpdateTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
              isGpsActive: true,
              isBackgroundActive: false
            }];
          }
        });
      }
      
      // Pornire tracking GPS
      const trackingStarted = await startGpsTracking();
      if (!trackingStarted) {
        console.error("Nu s-a putut porni tracking-ul GPS");
        
        // Revenim la starea inactivă
        setTransportStatus("inactive");
        
        // Anunțăm utilizatorul
        toast({
          variant: "destructive",
          title: "Eroare",
          description: "Nu s-a putut porni serviciul GPS. Verificați conexiunea.",
        });
        
        return false;
      }
      
      // Pornește serviciul de background pentru urmărire continuă
      console.log("Pornire serviciu de background pentru tracking continuu");
      try {
        // Funcția callback-ului pentru actualizări din background
        const onGpsUpdateFromBackground = (position: GeolocationPosition) => {
          const { latitude, longitude, altitude, speed, heading } = position.coords;
          
          // Actualizăm global ultimele coordonate cunoscute
          const gpsData = {
            lat: latitude,
            lng: longitude,
            timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
            viteza: speed ? speed * 3.6 : 0,
            directie: heading || 0,
            altitudine: altitude || 0,
            baterie: battery
          };
          
          setGpsCoordinates(gpsData);
          setLastGpsUpdateTime(gpsData.timestamp);
          
          console.log("Actualizare GPS din background:", gpsData);
        };
        
        // Pornirea serviciului de background
        await startBackgroundLocationTracking(
          vehicleInfo.nr, 
          currentActiveUit.uit, 
          token,
          onGpsUpdateFromBackground
        );
        
        // Marcăm serviciul ca activ
        setIsBackgroundActive(true);
        console.log("Serviciu background pornit cu succes");
      } catch (error) {
        console.error("Eroare la pornirea serviciului background:", error);
        // Nu oprim totul din cauza asta, continuăm cu tracking-ul normal
      }
      
      // Notificare utilizator
      toast({
        title: "Transport pornit",
        description: "Transportul a început. Trimitem coordonate GPS.",
      });
      
      // Emitem un mesaj vocal forțat pentru a ne asigura că utilizatorul aude notificarea
      try {
        // Verificăm dacă notificările vocale sunt activate
        const voiceNotificationsEnabled = localStorage.getItem('voice_notifications_enabled');
        console.log("EMITERE CRITICĂ notificare vocală pentru pornire transport - Status:", voiceNotificationsEnabled === 'true' ? "ACTIVE" : "DEZACTIVATE");
        
        // Doar dacă notificările vocale sunt activate, emitem sunetele și mesajele
        if (voiceNotificationsEnabled === 'true') {
          // 1. Anulăm orice sinteză vocală în curs
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
          
          // 2. Creăm un element audio pentru a forța un sunet inițial
          // Acest lucru va "trezi" sistemul audio al dispozitivului
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // Notă mai înaltă pentru atenție
          
          const gainNode = audioContext.createGain();
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Redăm un sunet scurt
          oscillator.start();
          setTimeout(() => {
            oscillator.stop();
            
            // 3. După oprirea sunetului, emitem mesajul vocal
            if (window.speechSynthesis) {
              // Creăm un nou mesaj cu volum maxim
              const utterance = new SpeechSynthesisUtterance("Transport început. Deplasare în curs.");
              utterance.lang = 'ro-RO';
              utterance.volume = 1.0;
              utterance.rate = 0.9;
              utterance.pitch = 1.0;
              
              // Înregistrăm evenimentele pentru debug
              utterance.onstart = () => console.log("Redare vocală pornită");
              utterance.onend = () => console.log("Redare vocală terminată");
              utterance.onerror = (e) => console.error("Eroare redare vocală:", e);
              
              // Emitem mesajul vocal
              window.speechSynthesis.speak(utterance);
              console.log("Notificare vocală la pornire emisă");
            }
          }, 200);
        }
        
        notificationSentRef.current = true;
      } catch (error) {
        console.error("Eroare critică la notificarea vocală:", error);
      }
      
      // Dacă am ajuns aici, înseamnă că totul a funcționat corect
      return true;
    } catch (error) {
      console.error("Eroare la pornirea transportului:", error);
      
      // În caz de eroare, oprim tracking-ul GPS dacă a fost pornit
      stopGpsTracking();
      
      // Resetăm starea transportului
      setTransportStatus("inactive");
      
      // Anunțăm utilizatorul despre eroare
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut porni cursa. Încercați din nou.",
      });
      
      return false;
    }
  };
  
  // Pauză transport
  const pauseTransport = async (): Promise<void> => {
    console.log("Pauză transport");
    
    try {
      // Oprim tracking-ul GPS
      stopGpsTracking();
      
      // Oprim serviciul de background
      if (isBackgroundActive) {
        const stopped = stopBackgroundLocationTracking();
        console.log("Oprire serviciu background:", stopped ? "Succes" : "Eșuat");
        setIsBackgroundActive(false);
      }
      
      // Schimbăm starea transportului
      setTransportStatus("paused");
      
      // Dezactivăm explicit GPS-ul DUPĂ ce am setat transportul în pauză
      setIsGpsActive(false);
      
      // Actualizăm registrul de transporturi
      if (vehicleInfo && vehicleInfo.nr) {
        setVehicleTransports(prev => {
          const existingIndex = prev.findIndex(t => t.vehicleNumber === vehicleInfo.nr);
          if (existingIndex >= 0) {
            const updatedTransports = [...prev];
            updatedTransports[existingIndex] = {
              ...updatedTransports[existingIndex],
              status: "paused",
              isGpsActive: false,
              isBackgroundActive: false,
              lastUpdateTime: new Date().toISOString().replace('T', ' ').substr(0, 19)
            };
            return updatedTransports;
          }
          return prev;
        });
      }
      
      // Notificare utilizator
      toast({
        title: "Transport în pauză",
        description: "Transportul a fost pus în pauză. GPS dezactivat.",
      });
      
      console.log("Transport pus în pauză cu succes");
    } catch (error) {
      console.error("Eroare la pauza transportului:", error);
      
      // Notificare utilizator
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut pune în pauză cursa.",
      });
    }
  };
  
  // Reluare transport
  const resumeTransport = async (): Promise<void> => {
    console.log("Reluare transport");
    
    try {
      // Schimbăm starea transportului
      setTransportStatus("active");
      
      // Pornim tracking-ul GPS din nou
      const trackingStarted = await startGpsTracking();
      if (!trackingStarted) {
        console.error("Nu s-a putut porni tracking-ul GPS la reluare");
        
        // Revenim la starea de pauză
        setTransportStatus("paused");
        
        // Anunțăm utilizatorul
        toast({
          variant: "destructive",
          title: "Eroare",
          description: "Nu s-a putut relua cursa. Verificați conexiunea GPS.",
        });
        
        return;
      }
      
      // Pornește serviciul de background pentru urmărire continuă
      console.log("Reluare serviciu de background pentru tracking continuu");
      try {
        // Funcția callback-ului pentru actualizări din background
        const onGpsUpdateFromBackground = (position: GeolocationPosition) => {
          const { latitude, longitude, altitude, speed, heading } = position.coords;
          
          // Actualizăm global ultimele coordonate cunoscute
          const gpsData = {
            lat: latitude,
            lng: longitude,
            timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
            viteza: speed ? speed * 3.6 : 0,
            directie: heading || 0,
            altitudine: altitude || 0,
            baterie: battery
          };
          
          setGpsCoordinates(gpsData);
          setLastGpsUpdateTime(gpsData.timestamp);
          
          console.log("Actualizare GPS din background (reluare):", gpsData);
        };
        
        // Pornirea serviciului de background - verificăm toate datele necesare
        if (vehicleInfo && vehicleInfo.nr && currentActiveUit && currentActiveUit.uit && token) {
          await startBackgroundLocationTracking(
            vehicleInfo.nr, 
            currentActiveUit.uit, 
            token,
            onGpsUpdateFromBackground
          );
        } else {
          console.error("Date lipsă pentru startBackgroundLocationTracking:", 
            { hasVehicle: !!vehicleInfo?.nr, hasUit: !!currentActiveUit?.uit, hasToken: !!token });
          throw new Error("Date insuficiente pentru pornirea serviciului de tracking în fundal");
        }
        
        // Marcăm serviciul ca activ
        setIsBackgroundActive(true);
        console.log("Serviciu background repornit cu succes");
      } catch (error) {
        console.error("Eroare la repornirea serviciului background:", error);
        // Nu oprim totul din cauza asta, continuăm cu tracking-ul normal
      }
      
      // Actualizăm registrul de transporturi
      if (vehicleInfo && vehicleInfo.nr) {
        setVehicleTransports(prev => {
          const existingIndex = prev.findIndex(t => t.vehicleNumber === vehicleInfo.nr);
          if (existingIndex >= 0) {
            const updatedTransports = [...prev];
            updatedTransports[existingIndex] = {
              ...updatedTransports[existingIndex],
              status: "active",
              isGpsActive: true,
              isBackgroundActive: true,
              lastUpdateTime: new Date().toISOString().replace('T', ' ').substr(0, 19)
            };
            return updatedTransports;
          }
          return prev;
        });
      }
      
      // Notificare utilizator
      toast({
        title: "Transport reluat",
        description: "Transportul a fost reluat. GPS reactivat.",
      });
      
      console.log("Transport reluat cu succes");
    } catch (error) {
      console.error("Eroare la reluarea transportului:", error);
      
      // Revenim la starea de pauză
      setTransportStatus("paused");
      
      // Notificare utilizator
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut relua cursa.",
      });
    }
  };
  
  // Finalizare transport
  const finishTransport = async (): Promise<void> => {
    console.log("Finalizare transport");
    
    try {
      // Oprim tracking-ul GPS
      stopGpsTracking();
      
      // Oprim serviciul de background
      if (isBackgroundActive) {
        const stopped = stopBackgroundLocationTracking();
        console.log("Oprire serviciu background la finalizare:", stopped ? "Succes" : "Eșuat");
        setIsBackgroundActive(false);
      }
      
      // Trimitem coordonatele finale cu statusul "finished"
      if (vehicleInfo && vehicleInfo.nr && currentActiveUit && token && gpsCoordinates) {
        try {
          // Obține poziția curentă pentru trimiterea finală
          const position = await getCurrentPosition();
          
          // Trimite datele către server cu status "finished"
          await sendGpsUpdate(position, {
            nr: vehicleInfo.nr,
            uit: currentActiveUit.uit
          }, token, "finished");
          
          console.log("Coordonate finale trimise cu status finished");
          
          // Verifică și sincronizează datele offline dacă există
          if (token) {
            await syncOfflineData(token);
          }
        } catch (error) {
          console.error("Eroare la trimiterea coordonatelor finale:", error);
        }
      }
      
      // Eliminăm transportul din registrul de transporturi active
      if (vehicleInfo && vehicleInfo.nr) {
        setVehicleTransports(prev => prev.filter(t => t.vehicleNumber !== vehicleInfo.nr));
        console.log("Transport eliminat din registru pentru vehiculul:", vehicleInfo.nr);
      }
      
      // Resetăm starea transportului
      setTransportStatus("inactive");
      setGpsCoordinates(null);
      setCurrentActiveUit(null);
      setLastGpsUpdateTime(null);
      setBattery(100);
      setIsGpsActive(false);
      
      // Ștergem explicit starea transportului din localStorage la finalizare
      if (vehicleInfo?.nr) {
        localStorage.removeItem(`transport_state_${vehicleInfo.nr}`);
        console.log("Stare transport ștearsă din localStorage la finalizare");
      }
      
      // Notificare utilizator
      toast({
        title: "Transport finalizat ✓",
        description: "Transportul a fost finalizat cu succes.",
      });
      
      // Reload listă de transporturi disponibile
      if (vehicleInfo && vehicleInfo.uit) {
        console.log("Regenerare listă transporturi după finalizare:", vehicleInfo);
        
        // Recreăm opțiunea de transport
        const newUit: UitOption = {
          uit: vehicleInfo.uit,
          start_locatie: vehicleInfo.start_locatie || "",
          stop_locatie: vehicleInfo.stop_locatie || ""
        };
        
        // Reset listă UIT-uri
        setSelectedUits([newUit]);
      }
      
      console.log("Transport finalizat cu succes");
    } catch (error) {
      console.error("Eroare la finalizarea transportului:", error);
      
      // Notificare utilizator
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut finaliza transportul. Încercați din nou.",
      });
    }
  };

  // Funcție pentru a obține lista completă de transporturi active
  const getAllVehicleTransports = useCallback(() => {
    return vehicleTransports;
  }, [vehicleTransports]);
  
  // Funcție pentru a obține un transport specific
  const getVehicleTransport = useCallback((vehicleNumber: string) => {
    return vehicleTransports.find(t => t.vehicleNumber === vehicleNumber);
  }, [vehicleTransports]);
  
  // Construire context
  const contextValue: TransportContextType = {
    transportStatus,
    gpsCoordinates,
    selectedUits,
    setSelectedUits,
    currentActiveUit,
    setCurrentActiveUit,
    startTransport,
    pauseTransport,
    resumeTransport,
    finishTransport,
    isGpsActive,
    lastGpsUpdateTime,
    battery,
    isBackgroundActive,
    currentVehicle,
    getAllVehicleTransports,
    getVehicleTransport
  };
  
  // Returnăm provider-ul cu valorile contextului
  return (
    <TransportContext.Provider value={contextValue}>
      {children}
    </TransportContext.Provider>
  );
}

// Hook pentru a folosi contextul
export const useTransport = () => {
  const context = useContext(TransportContext);
  
  if (context === undefined) {
    throw new Error('useTransport must be used within a TransportProvider');
  }
  
  return context;
};
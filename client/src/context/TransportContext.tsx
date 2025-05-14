import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CapacitorGeoService } from '@/lib/capacitorService';
import { getCurrentPosition } from "@/lib/transportService";
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
  
  // State pentru GPS și informații despre poziție
  const [gpsCoordinates, setGpsCoordinates] = useState<GpsCoordinates | null>(null);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [lastGpsUpdateTime, setLastGpsUpdateTime] = useState<string | null>(null);
  const [battery, setBattery] = useState<number>(100);
  const [isBackgroundActive, setIsBackgroundActive] = useState<boolean>(false);
  
  // State pentru transporturile disponibile
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
  const { token, vehicleInfo } = useAuth();
  const { toast } = useToast();
  
  // Actualizăm referința ori de câte ori se modifică statusul transportului
  useEffect(() => {
    transportStatusRef.current = transportStatus;
  }, [transportStatus]);
  
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
    
    return true;
  }, []);
  
  // Urmărirea poziției în timp real
  const startWatchPosition = useCallback(async () => {
    console.log("Start watch position pentru actualizări UI în timp real");
    
    try {
      // Solicităm permisiuni pentru geolocație
      await CapacitorGeoService.requestPermissions();
      
      // Începem urmărirea poziției
      const watchData = await CapacitorGeoService.watchPosition((position) => {
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
        
        // GPS se consideră activ DOAR dacă transportul este activ
        setIsGpsActive(transportStatus === "active");
      }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      
      // Salvăm referința pentru a putea opri urmărirea mai târziu
      watchPositionRef.current = watchData;
      
      return true;
    } catch (error) {
      console.error("Eroare la watchPosition:", error);
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
  
  // Inițializare GPS automată la pornire
  useEffect(() => {
    console.log("Inițializare GPS automată la pornire");
    
    const initGps = async () => {
      try {
        // Solicită permisiuni GPS
        const permissions = await CapacitorGeoService.requestPermissions();
        console.log("Permisiuni GPS obținute:", permissions);
        
        // Verifică disponibilitatea GPS-ului inițial
        const isGpsAvailable = await checkGpsAvailability();
        console.log("Disponibilitate GPS inițială:", isGpsAvailable ? "Disponibil" : "Indisponibil");
        
        // Obține poziția inițială pentru a popula harta
        try {
          const position = await getCurrentPosition();
          console.log("Poziție GPS inițială obținută:", {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          
          // Actualizează starea cu poziția inițială, dar nu activăm GPS-ul!
          // GPS-ul va fi marcat ca activ doar când un transport este activ
          setGpsCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
            viteza: 0,
            directie: 0,
            altitudine: 0,
            baterie: 100
          });
          
          // Pornește urmărirea poziției pentru UI (nu pentru trimitere periodică)
          await startWatchPosition();
        } catch (error) {
          console.error("Eroare la obținerea poziției inițiale:", error);
          
          // Afișăm un toast pentru a informa utilizatorul despre problema GPS
          toast({
            variant: "destructive",
            title: "Eroare GPS",
            description: "Nu s-a putut obține poziția GPS. Verificați dacă GPS-ul este activat și permisiunile acordate.",
          });
          
          // Setăm coordonate implicite pentru a evita erori de afișare
          // Acest lucru nu va trimite date false către server, ci doar ajută interfața
          // să nu se blocheze când nu există date GPS reale
          if (!gpsCoordinates) {
            setGpsCoordinates({
              lat: 44.4268, // Coordonate generice pentru București (doar pentru UI)
              lng: 26.1025,
              timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
              viteza: 0,
              directie: 0,
              altitudine: 0,
              baterie: 100
            });
          }
        }
      } catch (error) {
        console.error("Eroare la inițializarea GPS:", error);
      }
    };
    
    // Inițializează monitorizarea conectivității
    console.log("Inițializare monitorizare conectivitate");
    setupConnectivityListeners(
      // Callback pentru când conectivitatea este restaurată
      async () => {
        console.log("Conectivitate restaurată, sincronizare date offline");
        await syncOfflineData(token);
      }
    );
    
    // Inițializează GPS
    initGps();
    
    // Cleanup la unmount
    return () => {
      console.log("Cleanup monitorizare conectivitate");
      stopGpsTracking();
    };
  }, [startWatchPosition, stopGpsTracking, token]);
  
  // Actualizăm UIT-urile disponibile când se schimbă vehiculul
  useEffect(() => {
    if (vehicleInfo && vehicleInfo.uit) {
      // Setăm vehiculul curent
      setCurrentVehicle(vehicleInfo.nr);
      
      // Actualizăm UIT-urile disponibile
      const newUit: UitOption = {
        uit: vehicleInfo.uit,
        start_locatie: vehicleInfo.start_locatie || "",
        stop_locatie: vehicleInfo.stop_locatie || ""
      };
      
      // Verificăm dacă UIT-ul există deja
      const uitExists = selectedUits.some(uit => uit.uit === newUit.uit);
      
      if (!uitExists) {
        setSelectedUits(prev => [...prev, newUit]);
        console.log("UIT adăugat pentru vehiculul nou:", newUit);
      }
      
      // Setăm UIT-ul curent dacă nu există unul
      if (!currentActiveUit) {
        setCurrentActiveUit(newUit);
      }
    }
  }, [vehicleInfo?.nr, vehicleInfo?.uit, selectedUits, currentActiveUit]);
  
  // Implementare pentru a prelua toate transporturile active
  const getAllVehicleTransports = useCallback((): VehicleTransport[] => {
    return vehicleTransports;
  }, [vehicleTransports]);
  
  // Implementare pentru a obține un transport specific
  const getVehicleTransport = useCallback((vehicleNumber: string): VehicleTransport | undefined => {
    return vehicleTransports.find(t => t.vehicleNumber === vehicleNumber);
  }, [vehicleTransports]);
  
  // Actualizarea registrului de transporturi când se schimbă starea transportului
  useEffect(() => {
    if (!vehicleInfo || !vehicleInfo.nr || !currentActiveUit) return;
    
    // Dacă transportul este inactiv sau finalizat, nu facem nimic
    if (transportStatus === "inactive" || transportStatus === "finished") return;
    
    const currentTime = new Date().toISOString().replace('T', ' ').substr(0, 19);
    const vehicleNumber = vehicleInfo.nr;
    
    // Verificăm dacă există deja un transport pentru acest vehicul
    const existingIndex = vehicleTransports.findIndex(t => t.vehicleNumber === vehicleNumber);
    
    if (existingIndex >= 0) {
      // Actualizăm informațiile pentru transportul existent
      const updatedTransports = [...vehicleTransports];
      updatedTransports[existingIndex] = {
        ...updatedTransports[existingIndex],
        status: transportStatus,
        lastPosition: gpsCoordinates,
        lastUpdateTime: currentTime,
        isGpsActive: isGpsActive,
        isBackgroundActive: isBackgroundActive
      };
      setVehicleTransports(updatedTransports);
    } else if (transportStatus === "active" || transportStatus === "paused") {
      // Adăugăm un nou transport în registru
      setVehicleTransports(prev => [
        ...prev,
        {
          vehicleNumber,
          uit: currentActiveUit.uit,
          status: transportStatus,
          lastPosition: gpsCoordinates,
          startTime: currentTime,
          lastUpdateTime: currentTime,
          isGpsActive,
          isBackgroundActive
        }
      ]);
    }
  }, [transportStatus, vehicleInfo?.nr, currentActiveUit, gpsCoordinates, isGpsActive, isBackgroundActive]);
  
  // Pornire transport
  const startTransport = async (): Promise<boolean> => {
    console.log("Pornire transport - Verificare condiții");
    
    // Verificăm dacă avem toate datele necesare
    if (!vehicleInfo || !token) {
      console.error("Date lipsă pentru pornirea transportului:");
      console.log("vehicleInfo:", vehicleInfo);
      console.log("token:", token ? "Există" : "Lipsă");
      
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Lipsesc date de autentificare. Vă rugăm reconectați-vă.",
      });
      
      return false;
    }
    
    // Verificăm dacă este selectat un UIT
    if (!currentActiveUit) {
      console.error("Niciun UIT selectat pentru transport");
      
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Vă rugăm selectați un UIT pentru a începe transportul.",
      });
      
      return false;
    }
    
    try {
      // Validăm UIT-ul (trebuie să existe în lista de UIT-uri disponibile)
      const isValidUit = selectedUits.some(uit => uit.uit === currentActiveUit.uit);
      if (!isValidUit) {
        console.error("UIT invalid selectat:", currentActiveUit);
        
        toast({
          variant: "destructive",
          title: "Eroare",
          description: "UIT invalid. Vă rugăm selectați un UIT valid.",
        });
        
        return false;
      }
      
      // Actualizam starea transportului
      setTransportStatus("active");
      
      // Pornim GPS tracking
      const trackingStarted = await startGpsTracking();
      if (!trackingStarted) {
        console.error("Nu s-a putut porni tracking-ul GPS");
        setTransportStatus("inactive");
        
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
      console.error("Eroare la punerea în pauză a transportului:", error);
      
      // Notificare utilizator
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut întrerupe temporar cursa.",
      });
    }
  };
  
  // Reluare transport
  const resumeTransport = async (): Promise<void> => {
    console.log("Reluare transport");
    
    try {
      // Verificăm dacă transportul este în pauză
      if (transportStatus !== "paused") {
        console.error("Nu se poate relua un transport care nu este în pauză");
        return;
      }
      
      // Schimbăm starea transportului
      setTransportStatus("active");
      
      // Pornim tracking-ul GPS
      const trackingStarted = await startGpsTracking();
      if (!trackingStarted) {
        console.error("Nu s-a putut reporni tracking-ul GPS");
        
        // Revenim la starea de pauză
        setTransportStatus("paused");
        
        toast({
          variant: "destructive",
          title: "Eroare",
          description: "Nu s-a putut relua cursa. Verificați conexiunea GPS.",
        });
        
        return;
      }
      
      // Pornim serviciul de background
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
        
        // Pornirea serviciului de background
        await startBackgroundLocationTracking(
          vehicleInfo.nr, 
          currentActiveUit.uit, 
          token,
          onGpsUpdateFromBackground
        );
        
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
      
      // Trimitem ultima poziție GPS cu status "finished"
      if (gpsCoordinates && vehicleInfo && currentActiveUit && token) {
        try {
          const position = await getCurrentPosition();
          await sendGpsUpdate(
            position,
            { nr: vehicleInfo.nr, uit: currentActiveUit.uit },
            token,
            "finished"  // Marcăm explicit statusul ca finished
          );
          console.log("Ultima poziție GPS trimisă cu status 'finished'");
        } catch (error) {
          console.error("Eroare la trimiterea ultimei poziții GPS:", error);
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
        description: "Nu s-a putut finaliza cursa. Încercați din nou.",
      });
    }
  };
  
  // Valoarea contextului
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
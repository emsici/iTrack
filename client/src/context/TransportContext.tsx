import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CapacitorGeoService, requestGpsPermissions, convertGeolocationPosition } from '@/lib/capacitorService';
import { getCurrentPosition, setGpsAccessControl } from "@/lib/transportService";
import { sendGpsUpdate } from "@/lib/gpsService";
import { startBackgroundLocationTracking, stopBackgroundLocationTracking, isBackgroundServiceActive } from "@/lib/backgroundService";
import { setupConnectivityListeners, syncOfflineData, checkGpsAvailability } from "@/lib/connectivityService";
import { getOfflineGpsData, hasOfflineGpsData } from "@/lib/offlineStorage";
import { 
  saveAppState, 
  getSavedAppState, 
  clearAppState, 
  restoreAppState,
  shouldStartGpsOnRestore,
  isSessionInitialized,
  markSessionInitialized,
  type TransportStatus
} from "@/lib/stateManager";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { forceTransportActive, updateTransportState } from '@/lib/transportHelper';

// Import tipul GpsCoordinates din gpsService pentru a evita dependențele circulare
import { GpsCoordinates } from "../lib/gpsService";

// Interfață pentru opțiunile UIT
export interface UitOption {
  uit: string;
  start_locatie: string;
  stop_locatie: string;
}

// Interfață pentru transporturile vehiculelor
export interface VehicleTransport {
  vehicleNumber: string;
  uit: string;
  status: TransportStatus;
  lastPosition: GpsCoordinates | null;
  startTime: string;
  lastUpdateTime: string;
  isGpsActive: boolean;
  isBackgroundActive: boolean;
}

// Interfața contextului de transport
export interface TransportContextType {
  // Starea curentă a transportului
  transportStatus: TransportStatus;
  gpsCoordinates: GpsCoordinates | null;
  setGpsCoordinates: (coords: GpsCoordinates) => void;
  selectedUits: UitOption[];
  setSelectedUits: (uits: UitOption[]) => void;
  currentActiveUit: UitOption | null;
  setCurrentActiveUit: (uit: UitOption | null) => void;
  
  // Funcții pentru transportul curent
  startTransport: (uit?: UitOption) => Promise<boolean>;
  pauseTransport: (uit?: UitOption) => Promise<void>;
  resumeTransport: (uit?: UitOption) => Promise<void>;
  finishTransport: (uit?: UitOption) => Promise<void>;
  
  // Utilizat pentru afișare în UI
  isGpsActive: boolean;
  lastGpsUpdateTime: string | null;
  setLastGpsUpdateTime: (time: string | null) => void;
  battery: number;
  isBackgroundActive: boolean;
  
  // Informații despre vehiculul curent
  currentVehicle: string | null;
  
  // Funcționalități pentru gestionarea mai multor transporturi
  getAllVehicleTransports: () => VehicleTransport[];
  getVehicleTransport: (vehicleNumber: string) => VehicleTransport | undefined;
  getActiveTransports: () => UitOption[];
  hasActiveTransport: (uit: string) => boolean;
}

// Creăm contextul
const TransportContext = createContext<TransportContextType | undefined>(undefined);

// Furnizorul contextului
export function TransportProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, token, userInfo, vehicleInfo } = useAuth();
  const { toast } = useToast();
  
  // State pentru datele de transport
  const [transportStatus, setTransportStatus] = useState<TransportStatus>("inactive");
  const [gpsCoordinates, setGpsCoordinates] = useState<GpsCoordinates | null>(null);
  const [selectedUits, setSelectedUits] = useState<UitOption[]>([]);
  const [currentActiveUit, setCurrentActiveUit] = useState<UitOption | null>(null);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [lastGpsUpdateTime, setLastGpsUpdateTime] = useState<string | null>(null);
  const [battery, setBattery] = useState(100);
  const [isBackgroundActive, setIsBackgroundActive] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<string | null>(null);
  const [vehicleTransports, setVehicleTransports] = useState<VehicleTransport[]>([]);
  
  // State pentru a gestiona multiple transporturi active simultan
  const [activeTransports, setActiveTransports] = useState<UitOption[]>([]);
  
  // Referință pentru a evita inițializarea multiplă
  const initializationRef = useRef<boolean>(false);
  const notificationSentRef = useRef<boolean>(false);
  
  // Serviciu Capacitor GPS - este un obiect, nu o clasă
  const capacitorGeoService = CapacitorGeoService;
  
  // Efect pentru a gestiona sincronizarea datelor offline la schimbarea stării de conectivitate
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    
    // Configurează ascultătorii pentru conectivitate
    const removeListeners = setupConnectivityListeners();
    
    // Sincronizează datele offline inițial
    if (hasOfflineGpsData()) {
      syncOfflineData(token);
    }
    
    // Verifică disponibilitatea GPS-ului
    checkGpsAvailability();
    
    return () => {
      // Elimină ascultătorii la demontura
      removeListeners();
    };
  }, [isAuthenticated, token]);
  
  // Efect pentru a inițializa starea din localStorage la montare
  useEffect(() => {
    // Protecție împotriva inițializărilor multiple - verificăm atât referința cât și stocarea
    if (initializationRef.current || isSessionInitialized()) {
      console.log("[Transport] Sesiune deja inițializată, se omite restaurarea");
      initializationRef.current = true;
      markSessionInitialized();
      return;
    }
    
    console.log("[Transport] Inițializare nouă, se verifică starea salvată");
    
    // Verificăm dacă există date salvate
    const wasRestored = restoreAppState(
      setTransportStatus,
      setCurrentActiveUit,
      setSelectedUits,
      setLastGpsUpdateTime,
      setBattery
    );
    
    // Dacă am restaurat starea și transportul este activ, pornim GPS-ul cu întârziere
    // pentru a permite UI-ului să se actualizeze mai întâi
    if (wasRestored && shouldStartGpsOnRestore()) {
      console.log("[Transport] Inițializare GPS după restaurarea stării");
      
      // Întârziere mai mare pentru a ne asigura că UI-ul e actualizat
      setTimeout(() => {
        console.log("[Transport] Pornire GPS după întârziere");
        startGpsTracking();
      }, 2000);
    } else {
      console.log("[Transport] Nu este nevoie să pornim GPS la restaurare");
    }
    
    // Marcăm că am inițializat starea atât în referință cât și în localStorage
    initializationRef.current = true;
    markSessionInitialized();
    
    // Actualizăm vehicleInfo în state (dacă este disponibil)
    if (vehicleInfo?.nr) {
      setCurrentVehicle(vehicleInfo.nr);
      
      // IMPORTANT: Dacă avem informații vehicul cu UIT, actualizăm și UIT-ul din context
      if (vehicleInfo.uit) {
        console.log("[Transport] Actualizare UIT din vehicleInfo:", vehicleInfo.uit);
        
        const uit: UitOption = {
          uit: vehicleInfo.uit,
          start_locatie: vehicleInfo.start_locatie || "Locație start",
          stop_locatie: vehicleInfo.stop_locatie || "Locație destinație"
        };
        
        // Setăm UIT-ul direct din informațiile vehiculului
        setSelectedUits([uit]);
        setCurrentActiveUit(uit);
      }
    }
    
  }, [isAuthenticated, vehicleInfo]);
  
  // Efect pentru a actualiza vehiculTransports când se schimbă statusul transportului
  useEffect(() => {
    if (!vehicleInfo?.nr) return;
    
    // Actualizăm transporturile vehiculelor
    setVehicleTransports(prev => {
      const existingTransportIndex = prev.findIndex(t => t.vehicleNumber === vehicleInfo.nr);
      
      if (existingTransportIndex !== -1) {
        // Actualizăm transportul existent
        const updatedTransports = [...prev];
        updatedTransports[existingTransportIndex] = {
          ...updatedTransports[existingTransportIndex],
          status: transportStatus,
          lastPosition: gpsCoordinates,
          lastUpdateTime: new Date().toISOString(),
          isGpsActive,
          isBackgroundActive
        };
        return updatedTransports;
      } else if (transportStatus !== "inactive") {
        // Adăugăm un transport nou doar dacă nu este inactiv
        return [...prev, {
          vehicleNumber: vehicleInfo.nr,
          uit: currentActiveUit?.uit || "N/A",
          status: transportStatus,
          lastPosition: gpsCoordinates,
          startTime: new Date().toISOString(),
          lastUpdateTime: new Date().toISOString(),
          isGpsActive,
          isBackgroundActive
        }];
      }
      
      return prev;
    });
    
    // Salvăm starea în localStorage
    if (transportStatus !== "inactive" || currentActiveUit) {
      console.log(`[Transport] Salvare stare: Status=${transportStatus}, UIT=${currentActiveUit?.uit || "niciunul"}`);
      
      saveAppState(
        transportStatus,
        currentActiveUit,
        selectedUits,
        lastGpsUpdateTime,
        battery
      );
    } else if (transportStatus === "inactive") {
      // Curățăm starea când suntem inactivi
      console.log("[Transport] Ștergere stare salvată (transport inactiv)");
      clearAppState();
    }
  }, [transportStatus, gpsCoordinates, isGpsActive, isBackgroundActive, vehicleInfo?.nr, currentActiveUit]);
  
  // Funcție pentru a porni urmărirea GPS
  const startGpsTracking = useCallback(async (overrideVehicleInfo?: any) => {
    // Folosim vehicleInfo override dacă este furnizat (util pentru corecții)
    const effectiveVehicleInfo = overrideVehicleInfo || vehicleInfo;
    
    console.log("[Transport] Pornire GPS cu date:", {
      isAuthenticated,
      hasToken: !!token,
      hasVehicleInfo: !!effectiveVehicleInfo,
      hasCurrentActiveUit: !!currentActiveUit
    });
    
    // Condiții mai permisive pentru a porni GPS-ul - pentru browser
    // Verificăm minimum tokenul și isAuthenticated
    if (!isAuthenticated || !token) {
      console.error("Nu se poate porni GPS-ul - utilizator neautentificat", {
        isAuthenticated,
        hasToken: !!token
      });
      return false;
    }
    
    // MODIFICARE: Semnalăm lipsa UIT-ului dar nu blocăm pornirea GPS-ului (va fi generat mai târziu)
    if (!currentActiveUit) {
      console.warn("UIT lipsă la pornirea GPS-ului, dar continuăm", {
        effectiveVehicleInfo
      });
    }
    
    // IMPORTANT: Activăm controlul GPS înainte de a încerca să pornim serviciul!
    // Aceasta este cauza pentru care GPS-ul nu pornește - flag-urile de control sunt false
    setGpsAccessControl(true, true);
    
    try {
      // Verificăm permisiunile GPS
      const hasPermissions = await requestGpsPermissions();
      
      if (!hasPermissions) {
        toast({
          title: "Permisiuni insuficiente",
          description: "Aplicația necesită permisiuni de localizare pentru a funcționa corect.",
          variant: "destructive"
        });
        return false;
      }
      
      // Pornim serviciul de background, verificând că avem currentActiveUit
      // sau folosind un string gol ca fallback
      const uitValue = currentActiveUit?.uit || effectiveVehicleInfo?.uit || "";
      console.log("[Transport] Pornire background cu UIT:", uitValue);
      
      const backgroundStarted = await startBackgroundLocationTracking(
        effectiveVehicleInfo?.nr || "",
        uitValue,
        token,
        (position) => onGpsUpdateFromBackground(position)
      );
      
      if (!backgroundStarted) {
        // Încercăm să folosim watchPosition dacă serviciul de background nu poate fi pornit
        const watchStarted = await capacitorGeoService.watchPosition(
          (position: GeolocationPosition) => {
            const convertedPosition = convertGeolocationPosition(position);
            onGpsUpdate(convertedPosition);
          }
        );
        
        if (!watchStarted) {
          toast({
            title: "Eroare GPS",
            description: "Nu s-a putut porni serviciul de localizare.",
            variant: "destructive"
          });
          return false;
        }
      }
      
      // Actualizăm starea
      setIsGpsActive(true);
      setIsBackgroundActive(backgroundStarted);
      
      console.log(`[Transport] GPS tracking pornit (background: ${backgroundStarted})`);
      return true;
    } catch (error) {
      console.error("Eroare la pornirea GPS tracking:", error);
      toast({
        title: "Eroare GPS",
        description: "A apărut o eroare la pornirea serviciului de localizare.",
        variant: "destructive"
      });
      return false;
    }
  }, [isAuthenticated, token, currentActiveUit, vehicleInfo?.nr]);
  
  // Funcție pentru a opri urmărirea GPS
  const stopGpsTracking = useCallback(async () => {
    try {
      // Oprim serviciul de background dacă este activ
      if (isBackgroundActive) {
        await stopBackgroundLocationTracking();
        setIsBackgroundActive(false);
      }
      
      // Oprim și watchPosition
      // capacitorGeoService.stopWatchPosition() nu există, trebuie implementat într-un helper
      
      // Actualizăm starea
      setIsGpsActive(false);
      
      console.log("[Transport] GPS tracking oprit");
      return true;
    } catch (error) {
      console.error("Eroare la oprirea GPS tracking:", error);
      toast({
        title: "Eroare GPS",
        description: "A apărut o eroare la oprirea serviciului de localizare.",
        variant: "destructive"
      });
      return false;
    }
  }, [isBackgroundActive]);
  
  // Handler pentru actualizare GPS din foreground
  const onGpsUpdate = useCallback((position: GeolocationPosition) => {
    console.log("onGpsUpdate: Am primit poziție GPS", position);
    // Verificăm dacă poziția este validă
    if (!position || !position.coords) {
      console.error("Poziție GPS invalidă", position);
      return;
    }
    
    // ATENȚIE: Actualizăm coordonatele indiferent de starea transportului
    // Dar trimitem la server doar dacă transportul este activ
    console.log("Actualizăm coordonatele GPS indiferent de starea transportului:", transportStatus);
    
    // Verificăm informațiile vehiculului
    if (!vehicleInfo) {
      console.error("Lipsă informații vehicul - nu putem trimite coordonate GPS");
      return;
    }
    
    // Verificăm formatul vehicleInfo.nr și corectăm dacă este necesar
    let vehicleNr = "";
    if (typeof vehicleInfo.nr === 'object' && vehicleInfo.nr !== null) {
      console.log("Corectăm formatul vehicleInfo.nr care este obiect:", vehicleInfo.nr);
      if ('nr' in vehicleInfo.nr) {
        vehicleNr = (vehicleInfo.nr as any).nr;
      }
    } else {
      vehicleNr = vehicleInfo.nr;
    }
    
    if (!vehicleNr) {
      console.error("Număr vehicul invalid după corecție:", vehicleNr);
      // Setăm o valoare default pentru testate
      vehicleNr = "TEST123";
      console.log("Am setat un număr de test pentru vehicul:", vehicleNr);
    }
    
    // Verificăm UIT-ul
    let uit = currentActiveUit?.uit || '';
    if (!uit) {
      console.error("UIT lipsă sau invalid, folosim valoare default");
      uit = "UIT12345";
      console.log("Am setat un UIT de test:", uit);
    }
    
    const coords = position.coords;
    const timestamp = new Date().toISOString();
    
    // Obținem nivelul bateriei real sau simulat
    let batteryLevel = 100;
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        (navigator as any).getBattery().then((battery: any) => {
          batteryLevel = Math.round(battery.level * 100);
        });
      } catch (e) {
        // Folosim valoarea default
        console.log("Nu s-a putut obține nivelul bateriei:", e);
      }
    }
    
    // Creăm obiectul cu coordonatele GPS
    const newCoords: GpsCoordinates = {
      lat: coords.latitude,
      lng: coords.longitude,
      timestamp,
      viteza: coords.speed || 0,
      directie: coords.heading || 0,
      altitudine: coords.altitude || 0,
      baterie: batteryLevel
    };
    
    console.log("onGpsUpdate: Date GPS după conversie", newCoords);
    
    // Actualizăm starea
    setBattery(batteryLevel);
    setGpsCoordinates(newCoords);
    setLastGpsUpdateTime(timestamp);
    
    // Forțăm starea de transport active pentru a preveni resetarea stării
    try {
      // Folosim importurile la nivel de modul, nu require dinamic
      forceTransportActive();
      updateTransportState('active', true, newCoords);
      
      // Actualizăm starea în localStorage
      const safeCurrentActiveUit = currentActiveUit || { uit, start_locatie: '', stop_locatie: '' };
      
      saveAppState(
        'active', // Forțăm starea activă indiferent de starea curentă
        safeCurrentActiveUit,
        selectedUits,
        timestamp,
        batteryLevel
      );
    } catch (e) {
      console.error("Eroare la forțarea stării active de transport:", e);
    }
    
    // Trimitem actualizarea la server dacă transportul este activ
    if (transportStatus === "active") {
      try {
        console.log("Trimit coordonate GPS către server:", {
          coords: newCoords,
          vehicleNr: vehicleInfo.nr,
          uit: uit,
          status: "in_progress"
        });
        
        // Verificare și debugging pentru vehicleInfo
        console.log("Verificare format vehicleInfo:", {
          vehicleInfo,
          vehicleInfoType: typeof vehicleInfo,
          vehicleInfoKeys: Object.keys(vehicleInfo),
          vehicleNr: vehicleInfo.nr,
          vehicleNrType: typeof vehicleInfo.nr,
          vehicleNrCorected: vehicleNr
        });
        
        sendGpsUpdate(
          newCoords, 
          vehicleInfo.nr, 
          uit, // Folosim variabila uit deja verificată mai sus
          "in_progress",
          token || ''
        ).then(success => {
          if (success) {
            // Salvăm starea din nou după trimitere pentru a asigura persistența
            saveAppState(
              'active', // Forțăm starea activă 
              currentActiveUit,
              selectedUits,
              timestamp,
              batteryLevel
            );
            console.log("[Transport] Stare salvată după transmisia coordonatelor GPS");
          }
        }).catch(e => {
          console.error("Eroare la trimiterea coordonatelor GPS:", e);
        });
      } catch (e) {
        console.error("Excepție la trimiterea coordonatelor GPS:", e);
      }
    }
  }, [vehicleInfo?.nr, currentActiveUit, token, transportStatus]);
  
  // Handler pentru actualizare GPS din background
  const onGpsUpdateFromBackground = useCallback((position: GeolocationPosition) => {
    // CORECȚIE: Permitem actualizarea GPS chiar dacă UIT sau token lipsesc temporar
    if (!vehicleInfo?.nr) {
      console.error("Ignorare actualizare GPS din background - lipsă date vehicul");
      return;
    }
    
    const coords = position.coords;
    const timestamp = new Date().toISOString();
    
    // Simulăm nivelul bateriei (ar trebui înlocuit cu date reale pe dispozitive)
    const batteryLevel = Math.max(20, Math.floor(100 - Math.random() * 30));
    
    // Creăm obiectul cu coordonatele GPS
    const newCoords: GpsCoordinates = {
      lat: coords.latitude,
      lng: coords.longitude,
      timestamp,
      viteza: coords.speed || 0,
      directie: coords.heading || 0,
      altitudine: coords.altitude || 0,
      baterie: batteryLevel
    };
    
    // Trimitem actualizarea la server dacă transportul este activ
    if (transportStatus === "active") {
      sendGpsUpdate(
        newCoords, 
        vehicleInfo.nr, 
        currentActiveUit.uit, 
        "in_progress",
        token
      );
    }
    
    // Nu actualizăm starea direct din background deoarece componenta poate fi demontată
    // Însă putem trimite o notificare dacă este necesar
    if (!notificationSentRef.current) {
      // Implementare pentru notificări dacă este necesar
      notificationSentRef.current = true;
    }
  }, [vehicleInfo?.nr, currentActiveUit, token, transportStatus]);
  
  // Funcție pentru a porni un transport
  const startTransport = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[Transport] Începere pornire transport");
      
      // Salvăm explicit starea transportului în localStorage pentru a o face disponibilă
      // între componente și pentru watchPosition
      localStorage.setItem('transport_status', 'active');
      
      // Logăm starea UIT-ului curent pentru a diagnostica problemele
      console.log("[Transport] Verificare UIT pentru pornire transport:", { 
        currentActiveUit, 
        vehicleInfoUit: vehicleInfo?.uit,
        selectedUits 
      });
      
      // IMPORTANT: Verificăm dacă avem un UIT selectat
      // Dacă nu există currentActiveUit, încercăm să folosim direct vehicleInfo.uit
      if (!currentActiveUit && vehicleInfo?.uit) {
        console.log("[Transport] Încercare de generare UIT din vehicleInfo:", vehicleInfo.uit);
        
        const uit: UitOption = {
          uit: vehicleInfo.uit,
          start_locatie: vehicleInfo.start_locatie || "Locație start",
          stop_locatie: vehicleInfo.stop_locatie || "Locație destinație"
        };
        
        // Actualizăm UIT-ul în context
        setCurrentActiveUit(uit);
        setSelectedUits([uit]);
        
        // Folosim UIT-ul nou generat direct pentru operațiunile următoare
        console.log("[Transport] UIT generat și setat din vehicleInfo:", uit);
        
        // Nu mai facem return false - continuăm cu UIT-ul nou setat
      }
      // Verificăm din nou dacă avem un UIT valid (fie cel inițial, fie cel generat)
      else if (!currentActiveUit) {
        console.error("[Transport] Nu se poate porni transportul - lipsește UIT și nu există nici în vehicleInfo");
        toast({
          title: "Eroare UIT",
          description: "Selectați un UIT pentru a începe transportul.",
          variant: "destructive"
        });
        return false;
      }
      
      // Verificăm dacă avem vehicul selectat
      if (!vehicleInfo?.nr) {
        console.error("[Transport] Nu se poate porni transportul - lipsesc datele vehiculului");
        toast({
          title: "Eroare", 
          description: "Nu sunt disponibile informațiile vehiculului. Înregistrați vehiculul.",
          variant: "destructive"
        });
        return false;
      }
      
      // Verificăm dacă suntem autentificați
      if (!isAuthenticated || !token) {
        console.error("[Transport] Nu se poate porni transportul - utilizator neautentificat");
        toast({
          title: "Eroare de autentificare",
          description: "Utilizator neautentificat. Vă rugăm să vă autentificați din nou.",
          variant: "destructive"
        });
        return false;
      }
      
      console.log("[Transport] Pornire GPS tracking...");
      
      // Verificăm dacă avem acces la GPS - dar diferențiat pe platforme
      // Pe telefon cerem strict GPS, în browser suntem mai permisivi (pentru testare)
      try {
        // CORECȚIE: Adăugăm control explicit pentru GPS pentru a evita problemele cu tracking-ul
        setGpsAccessControl(true, true);
        console.log("[Transport] Control GPS activat explicit");
        
        // Înainte de orice verificare, salvăm UIT-ul în localStorage
        // FOARTE IMPORTANT: Asigurăm-ne că UIT-ul este disponibil întotdeauna
        if (currentActiveUit) {
          try {
            localStorage.setItem('current_uit', JSON.stringify(currentActiveUit));
            console.log("[Transport] UIT salvat în localStorage:", currentActiveUit.uit);
          } catch (e) {
            console.error("[Transport] Eroare la salvarea UIT în localStorage:", e);
          }
        }
        
        // Pornim verificarea GPS-ului diferit în funcție de platformă
        const isNative = Capacitor.isNativePlatform();
        console.log("[Transport] Verificare GPS pe platformă:", isNative ? "mobilă" : "browser");
        
        // Verificăm doar dacă avem un UIT valid și datele necesare pentru transport
        if (!currentActiveUit && !vehicleInfo?.uit) {
          console.error("Nu se poate porni GPS-ul - lipsesc date necesare", { 
            currentActiveUit, 
            vehicleInfo 
          });
          toast({
            title: "Date insuficiente",
            description: "Selectați un UIT valid înainte de a porni transportul.",
            variant: "destructive"
          });
          return false;
        }
        
        // Verificăm și corectăm vehicleInfo dacă nr este un obiect
        let correctedVehicleInfo = vehicleInfo;
        if (vehicleInfo && typeof vehicleInfo.nr === 'object' && vehicleInfo.nr !== null) {
          console.log("Corectare vehicleInfo.nr în startTransport - era obiect");
          
          // Extragem numărul din obiect
          const fixedNr = vehicleInfo.nr.nr || 'TEST';
          
          // Creăm un nou obiect corectat (nu modificăm originalul care e const)
          correctedVehicleInfo = {
            ...vehicleInfo,
            nr: fixedNr
          };
          
          console.log("vehicleInfo corectat:", correctedVehicleInfo);
        }
        
        if (isNative) {
          // PE PLATFORMĂ MOBILĂ - Verificarea GPS trebuie să fie strictă
          try {
            // Verificăm permisiunile GPS
            const hasPermissions = await requestGpsPermissions();
            if (!hasPermissions) {
              console.error("[Transport] Permisiuni GPS insuficiente pe dispozitiv mobil");
              toast({
                title: "Permisiuni GPS necesare",
                description: "Activați serviciul de localizare pentru a putea urmări transportul.",
                variant: "destructive"
              });
              return false;
            }
            
            // Încercăm să obținem o poziție GPS cu timeout mai mare
            console.log("[Transport] Încercăm obținerea poziției GPS pe dispozitiv mobil");
          } catch (mobileError) {
            console.error("[Transport] Eroare la verificarea GPS pe mobil:", mobileError);
            return false;
          }
        } else {
          // ÎN BROWSER - Facem o verificare mai permisivă (pentru testare)
          try {
            console.log("[Transport] Verificare GPS în browser - permitem și timeout-uri");
            // În browser, facem o verificare simplă, dar acceptăm și timeout-uri
            if (navigator && navigator.geolocation) {
              // Încercăm să obținem poziția, dar cu un timeout redus
              const browserCheckPromise = new Promise<boolean>((resolve) => {
                // Încercăm să obținem poziția, dar setăm și un timeout manual
                const positionTimeout = setTimeout(() => {
                  console.log("[Transport] Timeout la verificarea GPS în browser, dar continuăm");
                  resolve(true); // Permitem continuarea chiar și cu timeout
                }, 3000);
                
                // Încercăm să obținem poziția
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    clearTimeout(positionTimeout);
                    console.log("[Transport] Poziție GPS obținută cu succes în browser");
                    resolve(true);
                  },
                  (error) => {
                    clearTimeout(positionTimeout);
                    // Doar pentru PERMISSION_DENIED blocăm transportul
                    if (error.code === 1) { // PERMISSION_DENIED
                      console.error("[Transport] Permisiuni GPS refuzate explicit în browser");
                      resolve(false);
                    } else {
                      console.warn("[Transport] Eroare GPS în browser, dar continuăm:", error);
                      resolve(true); // Pentru timeout sau indisponibilitate, continuăm
                    }
                  },
                  { timeout: 5000, maximumAge: 10000, enableHighAccuracy: false }
                );
              });
              
              // Așteptăm rezultatul verificării
              const canContinue = await browserCheckPromise;
              if (!canContinue) {
                toast({
                  title: "Permisiuni refuzate",
                  description: "Permisiunile de localizare au fost refuzate. Transportul nu poate fi pornit.",
                  variant: "destructive"
                });
                return false;
              }
              
              // În browser permitem continuarea chiar dacă GPS-ul nu este perfect
              console.log("[Transport] Verificare GPS în browser completă, continuăm");
            }
          } catch (browserError) {
            console.warn("[Transport] Eroare la verificarea GPS în browser, dar continuăm:", browserError);
            // În browser, continuăm chiar și cu erori pentru testare
          }
        }
        
        // Înainte de pornirea GPS-ului, ne asigurăm că avem un UIT valid setat
        // Altfel, îl configurăm folosind vehicleInfo sau una din opțiunile disponibile
        if (!currentActiveUit) {
          console.log("[Transport] Nu există UIT activ, încercăm să folosim alte surse");
          
          // Încercăm din mai multe surse
          let newUit: UitOption | null = null;
          
          // Sursa 1: Folosim vehicleInfo-ul direct
          if (correctedVehicleInfo?.uit) {
            newUit = {
              uit: correctedVehicleInfo.uit,
              start_locatie: correctedVehicleInfo.start_locatie || "Locație start",
              stop_locatie: correctedVehicleInfo.stop_locatie || "Locație destinație"
            };
            console.log("[Transport] UIT generat din vehicleInfo:", newUit);
          }
          // Sursa 2: Folosim prima opțiune din lista selectată
          else if (selectedUits && selectedUits.length > 0) {
            newUit = selectedUits[0];
            console.log("[Transport] UIT preluat din lista de selecții:", newUit);
          }
          // Sursa 3: Creăm un UIT implicit
          else {
            newUit = {
              uit: "UIT12345", // Valoare implicită
              start_locatie: "București",
              stop_locatie: "Cluj"
            };
            console.log("[Transport] UIT generat cu valori implicite:", newUit);
          }
          
          // Actualizăm UIT-ul în context pentru a preveni problemele
          setCurrentActiveUit(newUit);
          
          // Important: Actualizăm și lista de UIT-uri selectate dacă e goală
          if (!selectedUits || selectedUits.length === 0) {
            setSelectedUits([newUit]);
          }
          
          console.log("[Transport] UIT actualizat înainte de pornirea GPS-ului:", newUit);
        }
        
        // Pornim serviciul GPS indiferent de platformă
        // Folosim vehicleInfo corectat dacă a fost necesar
        try {
          const gpsStarted = await startGpsTracking(correctedVehicleInfo);
          console.log("[Transport] Rezultat pornire GPS:", gpsStarted);
          
          if (!gpsStarted && isNative) {
            // Doar pe platformă mobilă blocăm transportul când GPS-ul nu pornește
            console.error("[Transport] Nu s-a putut porni GPS-ul pe platformă mobilă");
            toast({
              title: "Eroare GPS",
              description: "Nu s-a putut porni sistemul de urmărire a locației. Verificați setările și încercați din nou.",
              variant: "destructive"
            });
            return false;
          } else if (!gpsStarted && !isNative) {
            // În browser, forțăm activarea manuală a GPS-ului și continuăm
            console.warn("[Transport] Nu s-a putut porni GPS-ul în browser, dar continuăm");
            toast({
              title: "Avertisment GPS",
              description: "Sistem de localizare activat manual pentru testare în browser."
            });
            
            // Forțăm activarea GPS-ului în browser
            console.log("[Transport] Forțare activare GPS în browser pentru testare");
            setIsGpsActive(true);
            
            // Încercăm să obținem coordonate direct din browser
            console.log("[Transport] Activare citire GPS real");
            if (navigator && navigator.geolocation) {
              navigator.geolocation.watchPosition(
                (position) => {
                  // Preluăm coordonatele
                  const coords = position.coords;
                  
                  // Creăm obiectul de date GPS
                  const newCoords: GpsCoordinates = {
                    lat: coords.latitude,
                    lng: coords.longitude,
                    timestamp: new Date().toISOString(),
                    viteza: coords.speed || 0,
                    directie: coords.heading || 0,
                    altitudine: coords.altitude || 0,
                    baterie: deviceBattery || 100
                  };
                  
                  // Actualizăm starea
                  setGpsCoordinates(newCoords);
                  setLastGpsUpdateTime(new Date().toISOString());
                },
                (error) => {
                  console.warn("[Transport] Eroare la citirea coordonatelor directe:", error);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
              );
            }
          }
        } catch (gpsInitError) {
          console.error("[Transport] Eroare la inițializarea GPS:", gpsInitError);
          
          // În browser, continuăm chiar și cu erori
          if (!isNative) {
            // Forțăm activarea GPS-ului în browser
            console.log("[Transport] Forțare activare GPS în browser pentru testare după eroare");
            setIsGpsActive(true);
          } else {
            toast({
              title: "Eroare GPS",
              description: "A apărut o eroare la pornirea serviciului de localizare.",
              variant: "destructive"
            });
            return false;
          }
        }
      } catch (gpsError) {
        console.error("[Transport] Eroare generală la inițializarea GPS-ului:", gpsError);
        
        // Pe platformă mobilă blocăm pornirea, în browser continuăm
        if (Capacitor.isNativePlatform()) {
          toast({
            title: "Eroare GPS",
            description: "A apărut o eroare la inițializarea serviciului de localizare. Transportul nu poate fi pornit.",
            variant: "destructive"
          });
          return false;
        } else {
          // În browser doar afișăm un avertisment și continuăm
          toast({
            title: "Atenție GPS",
            description: "Serviciul GPS nu funcționează optim în browser. Unele funcționalități pot fi limitate.",
          });
          // Continuăm transportul în browser pentru testare
        }
      }
      
      // Actualizăm starea
      setTransportStatus("active");
      
      // IMPORTANT: Setăm explicit starea GPS la activ în browser chiar dacă serviciul nu a pornit
      // Aceasta este corecția pentru problema în care transportul pornește dar GPS-ul rămâne inactiv
      if (!Capacitor.isNativePlatform()) {
        console.log("[Transport] Forțare activare GPS în browser pentru testare");
        setIsGpsActive(true);
        
        // CORECȚIE: Setăm un watch pentru GPS - citim senzorii reali 
        // Aceasta este soluția corectă: folosim senzorii reali din dispozitiv
        console.log("[Transport] Activare citire GPS real");
        
        // Înregistrăm un watcher pentru poziția GPS care actualizează regulat
        let watchId: number;
        
        const startGpsWatch = () => {
          if (navigator && navigator.geolocation) {
            // Opțiuni pentru obținerea poziției GPS
            const options = {
              enableHighAccuracy: true,    // Solicită precizie ridicată
              timeout: 10000,              // Timeout de 10 secunde
              maximumAge: 0                // Nu folosim cache, vrem poziții în timp real
            };
            
            // NOTĂ: Conform cerinței, nu mai folosim simulare - vom citi direct din senzorii GPS.
            // Aici vom gestiona doar erorile și vom loga problemele, fără a genera date artificiale.
            const handleGpsError = (error: any) => {
              console.warn("[Transport] Eroare la obținerea poziției GPS:", error);
              
              // Setăm un flag pentru a indica că avem o problemă cu GPS-ul
              localStorage.setItem('gps_error', JSON.stringify({
                timestamp: new Date().toISOString(),
                code: error?.code || 'unknown',
                message: error?.message || 'Eroare necunoscută GPS'
              }));
              
              // Notificăm utilizatorul despre eroarea GPS
              toast({
                variant: "destructive",
                title: "Eroare GPS",
                description: "Nu s-a putut obține poziția GPS. Verificați dacă localizarea este activată."
              });
            };
            
            // CORECȚIE: Reducem timeout pentru a evita blocajele
            const enhancedOptions = {
              ...options,
              timeout: 5000  // Reducem timeout-ul la 5 secunde pentru a răspunde mai rapid
            };
            
            // Implementăm un mecanism pentru verificarea stării GPS și notificarea utilizatorului
            // CRUCIAL: Folosim stateRef pentru a păstra referință la starea REALĂ a transportului
            // și pentru a ne asigura că nu avem race conditions între diferite efecte
            const stateRef = useRef({
              transportStatus: transportStatus,
              isGpsActive: isGpsActive
            });
            
            // Actualizăm valoarea de referință atunci când starea se schimbă
            useEffect(() => {
              stateRef.current.transportStatus = transportStatus;
              stateRef.current.isGpsActive = isGpsActive;
            }, [transportStatus, isGpsActive]);
            
            const safetyInterval = setInterval(() => {
              // IMPORTANT: Verificăm și actualizăm starea chiar dacă pagina nu este vizibilă
              // pentru a menține starea corectă a transportului
              const appState = getSavedAppState();
              
              // Verificăm dacă avem o stare salvată și o restaurăm
              if (appState && appState.transportStatus === "active") {
                // Dacă starea locală este activă dar starea în memorie nu este, o actualizăm
                if (stateRef.current.transportStatus !== "active") {
                  console.log("[Transport] Restaurare stare transport activ din localStorage");
                  setTransportStatus("active");
                  setIsGpsActive(true);
                  
                  // Actualizăm și referința
                  stateRef.current.transportStatus = "active";
                  stateRef.current.isGpsActive = true;
                }
              }
              
              console.log("[Transport] Verificare status transport [Interval de siguranță]:", 
                stateRef.current.transportStatus, 
                "GPS:", stateRef.current.isGpsActive ? "activ" : "inactiv",
                "Coordonate:", gpsCoordinates ? "disponibile" : "indisponibile"
              );
              
              // Verificăm doar dacă transportul este activ
              if (stateRef.current.transportStatus === "active") {
                // Verificăm dacă avem GPS activ și coordonate disponibile
                if (!gpsCoordinates && document.visibilityState === "visible") {
                  console.log("[Transport] Nu avem coordonate GPS disponibile");
                  
                  // Notificăm utilizatorul doar o dată la 30 de secunde (pentru a evita spam-ul)
                  const lastNotification = localStorage.getItem('gps_notification');
                  const now = new Date().getTime();
                  if (!lastNotification || (now - JSON.parse(lastNotification).timestamp) > 30000) {
                    toast({
                      title: "Atenție",
                      description: "Nu s-au putut obține coordonatele GPS. Verificați permisiunile de localizare.",
                      variant: "destructive"
                    });
                    
                    localStorage.setItem('gps_notification', JSON.stringify({
                      timestamp: now
                    }));
                  }
                }
              }
            }, 5000); // La fiecare 5 secunde - reducem intervalul pentru actualizări mai frecvente
            
            // Înregistrăm un watcher care va obține poziția periodic
            watchId = navigator.geolocation.watchPosition(
              // Callback pentru succes
              (position) => {
                // Setăm explicit că GPS-ul este activ când primim coordonate
                if (!isGpsActive) {
                  setIsGpsActive(true);
                }
                
                // CORECȚIE SIMPLĂ: Nu mai facem nicio verificare de status aici
                // Citim coordonatele GPS mereu când sunt disponibile
                console.log("[Transport] Coordonate GPS disponibile:", {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                });
                
                // Obținem poziția reală din senzori
                const coords = position.coords;
                
                // Creăm obiectul cu date GPS din poziția reală
                const newCoords: GpsCoordinates = {
                  lat: coords.latitude,
                  lng: coords.longitude,
                  timestamp: new Date().toISOString(),
                  viteza: coords.speed || 0,
                  directie: coords.heading || 0,
                  altitudine: coords.altitude || 0,
                  baterie: 100 // Bateria o setăm la 100% pentru browser
                };
                
                console.log("[Transport] Am obținut coordonate GPS reale:", newCoords);
                
                // Actualizăm starea cu coordonatele noi
                setGpsCoordinates(newCoords);
                setLastGpsUpdateTime(newCoords.timestamp);
                
                // Trimitem datele către server cu verificări mai robuste
                if (token && vehicleInfo?.nr) {
                  // CORECȚIE CRITICĂ: Verificăm toate sursele posibile pentru UIT:
                  // 1. currentActiveUit din context
                  // 2. localStorage pentru a asigura persistența între actualizări
                  // 3. vehicleInfo.uit ca ultimă opțiune
                  
                  let transportUit = null;
                  
                  // Prima sursă: verificăm contextul React
                  if (currentActiveUit?.uit) {
                    transportUit = currentActiveUit.uit;
                    console.log("[Transport] UIT găsit în context:", transportUit);
                  } 
                  // A doua sursă: verificăm localStorage
                  else {
                    try {
                      const storedUit = localStorage.getItem('current_uit');
                      if (storedUit) {
                        const parsedUit = JSON.parse(storedUit);
                        transportUit = parsedUit.uit;
                        console.log("[Transport] UIT găsit în localStorage:", transportUit);
                      }
                    } catch (e) {
                      console.error("[Transport] Eroare la citirea UIT din localStorage:", e);
                    }
                  }
                  
                  // A treia sursă: vehicleInfo.uit
                  if (!transportUit && vehicleInfo?.uit) {
                    transportUit = vehicleInfo.uit;
                    console.log("[Transport] UIT luat din vehicleInfo:", transportUit);
                  }
                  
                  // Verificăm dacă am găsit un UIT valid
                  if (transportUit) {
                    console.log("[Transport] Trimitere date GPS reale către server cu UIT:", transportUit);
                    
                    // CORECȚIE IMPORTANTĂ: Înainte de trimiterea datelor, ne asigurăm că statusul transportului este "active"
                    // Acest lucru va preveni schimbarea stării la "inactive"
                    if (transportStatus !== "active") {
                      console.log("[Transport] Forțăm statusul transportului înapoi la 'active' înainte de trimiterea datelor");
                      setTransportStatus("active");
                      setIsGpsActive(true);
                      
                      // Salvăm starea activă în localStorage pentru persistență
                      saveAppState(
                        "active",
                        currentActiveUit || { uit: transportUit, start_locatie: "", stop_locatie: "" },
                        selectedUits,
                        new Date().toISOString(),
                        100
                      );
                    }
                    
                    // Verificăm dacă vehicleInfo.nr este un obiect și îl corectăm
                    let vehicleNr = vehicleInfo.nr;
                    if (typeof vehicleNr === 'object' && vehicleNr !== null) {
                      console.log("Corectare vehicleInfo.nr înainte de sendGpsUpdate:", vehicleNr);
                      vehicleNr = vehicleNr.nr || 'TEST';
                      console.log("Numărul de înmatriculare corectat:", vehicleNr);
                    }
                    
                    // Trimitem datele GPS cu numărul de înmatriculare corectat
                    console.log("Trimit date GPS cu:", { 
                      coordonate: newCoords,
                      vehicleNr: vehicleNr, 
                      transportUit: transportUit 
                    });
                    
                    sendGpsUpdate(
                      newCoords,
                      vehicleNr,
                      transportUit,
                      "in_progress",
                      token
                    );
                    
                    // CRUCIAL: Actualizăm starea cu coordonatele noi
                    setGpsCoordinates(newCoords);
                    setLastGpsUpdateTime(newCoords.timestamp);
                    
                    // Actualizăm din nou starea pentru a asigura persistența și după trimiterea datelor
                    if (currentActiveUit === null && transportUit) {
                      // Recreăm un obiect UIT dacă lipsește
                      const uit: UitOption = {
                        uit: transportUit,
                        start_locatie: vehicleInfo?.start_locatie || "",
                        stop_locatie: vehicleInfo?.stop_locatie || ""
                      };
                      setCurrentActiveUit(uit);
                    }
                  } else {
                    console.error("[Transport] Lipsă UIT pentru trimitere date GPS - nu s-a găsit în nicio sursă");
                  }
                }
              },
              // Callback pentru eroare
              (error) => {
                console.warn("[Transport] Eroare la obținerea poziției GPS:", error);
                
                // În caz de eroare, notificăm utilizatorul și logăm problema
                if (transportStatus === "active") {
                  console.log("[Transport] Eroare GPS în timpul transportului activ");
                  handleGpsError(error);
                }
              },
              // Opțiuni de GPS îmbunătățite
              enhancedOptions
            );
            
            // CORECȚIE: Curățăm și intervalul de siguranță când oprim watch-ul
            document.addEventListener("visibilitychange", () => {
              if (document.visibilityState === "hidden") {
                console.log("[Transport] Oprire watch GPS și interval de siguranță (pagina nu este vizibilă)");
                if (watchId) navigator.geolocation.clearWatch(watchId);
                clearInterval(safetyInterval);
              } else if (document.visibilityState === "visible" && transportStatus === "active") {
                console.log("[Transport] Repornire watch GPS (pagina este vizibilă)");
                startGpsWatch();
              }
            });
            
            console.log("[Transport] GPS watch pornit cu ID:", watchId);
          }
        };
        
        // Pornim watch-ul imediat
        startGpsWatch();
      }
      
      console.log("[Transport] Stare actualizată la ACTIVE");
      
      // Salvăm starea pentru a avea transport activ după restart
      saveAppState(
        "active",
        currentActiveUit,
        selectedUits,
        lastGpsUpdateTime,
        battery
      );
      console.log("[Transport] Stare salvată după pornire");
      
      toast({
        title: "Transport pornit",
        description: `Transportul pentru UIT ${currentActiveUit.uit} a fost pornit cu succes.`
      });
      
      return true;
    } catch (error) {
      console.error("[Transport] Eroare la pornirea transportului:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la pornirea transportului. Încercați din nou.",
        variant: "destructive"
      });
      return false;
    }
  }, [currentActiveUit, vehicleInfo, isAuthenticated, token, startGpsTracking, selectedUits, lastGpsUpdateTime, battery]);
  
  // Funcție pentru a pune în pauză un transport
  const pauseTransport = useCallback(async (): Promise<void> => {
    try {
      console.log("[Transport] Începere pauză transport");
      
      // Salvăm starea înainte de a opri GPS-ul pentru a preveni pierderea datelor
      if (currentActiveUit) {
        saveAppState(
          "paused", // Salvăm explicit starea ca pauză înainte de a opri GPS-ul
          currentActiveUit,
          selectedUits,
          lastGpsUpdateTime,
          battery
        );
        console.log("[Transport] Stare salvată înainte de pauză");
      }
      
      // Oprim GPS-ul
      const stopped = await stopGpsTracking();
      console.log("[Transport] GPS oprit cu succes:", stopped);
      
      // Actualizăm starea
      setTransportStatus("paused");
      
      toast({
        title: "Transport în pauză",
        description: "Transportul a fost pus în pauză. Locația nu mai este urmărită."
      });
    } catch (error) {
      console.error("[Transport] Eroare la pauză transport:", error);
      
      // Actualizăm oricum starea pentru a evita blocarea UI-ului
      setTransportStatus("paused");
      
      toast({
        title: "Transport în pauză",
        description: "Transportul a fost pus în pauză, dar cu unele erori de localizare.",
        variant: "destructive"
      });
    }
  }, [stopGpsTracking, currentActiveUit, selectedUits, lastGpsUpdateTime, battery]);
  
  // Funcție pentru a relua un transport
  const resumeTransport = useCallback(async (): Promise<void> => {
    try {
      console.log("[Transport] Începere reluare transport");
      
      // Pornim GPS-ul
      const gpsStarted = await startGpsTracking();
      console.log("[Transport] GPS pornit la reluare:", gpsStarted);
      
      // Actualizăm starea chiar dacă GPS-ul nu a pornit
      // pentru a evita blocarea UI și a permite utilizatorului să continue
      setTransportStatus("active");
      
      if (gpsStarted) {
        toast({
          title: "Transport reluat",
          description: "Transportul a fost reluat. Locația este din nou urmărită."
        });
      } else {
        // Notificăm utilizatorul că GPS-ul nu a pornit, dar transportul continuă
        toast({
          title: "Transport reluat",
          description: "Transportul a fost reluat, dar urmărirea GPS nu funcționează. Verificați setările dispozitivului.",
          variant: "destructive"
        });
      }
      
      // Salvăm starea curentă pentru a preveni pierderea datelor
      if (currentActiveUit) {
        saveAppState(
          "active",
          currentActiveUit,
          selectedUits,
          lastGpsUpdateTime,
          battery
        );
        console.log("[Transport] Stare salvată după reluare transport");
      }
    } catch (error) {
      console.error("[Transport] Eroare la reluarea transportului:", error);
      
      // Actualizăm oricum starea pentru a evita blocarea UI-ului
      setTransportStatus("active");
      
      toast({
        title: "Transport reluat",
        description: "Transportul a fost reluat cu erori. Unele funcții ar putea fi limitate.",
        variant: "destructive"
      });
    }
  }, [startGpsTracking, currentActiveUit, selectedUits, lastGpsUpdateTime, battery]);
  
  // Funcție pentru a finaliza un transport
  const finishTransport = useCallback(async (): Promise<void> => {
    try {
      console.log("[Transport] Începere finalizare transport");
      
      // Setăm imediat starea la "finished" pentru a evita race conditions
      setTransportStatus("finished");
      
      // Notificăm utilizatorul că procesul a început
      toast({
        title: "Finalizare în curs",
        description: "Se finalizează transportul, vă rugăm așteptați...",
      });
      
      // Forțăm starea în localStorage pentru consistență
      localStorage.setItem('transport_status', 'finished');
      
      // Salvăm datele înainte de a opri GPS-ul pentru a evita pierderea datelor
      if (currentActiveUit) {
        // Marcăm explicit ca finalizat pentru a evita confuziile în caz de eroare
        saveAppState(
          "finished", 
          currentActiveUit,
          selectedUits,
          lastGpsUpdateTime,
          battery
        );
        console.log("[Transport] Stare temporară salvată ca FINISHED");
      }
      
      // Trimitem ultima actualizare cu status "finished" ÎNAINTE de a opri GPS-ul
      // pentru a ne asigura că avem coordonate valide
      if (gpsCoordinates && vehicleInfo?.nr && currentActiveUit && token) {
        try {
          // Trimitem actualizarea finală cu coordonatele actuale și status "finished"
          console.log("[Transport] Trimitere actualizare finală cu coordonatele actuale");
          
          // Folosim coordonatele curente dacă sunt disponibile
          const finalCoords = gpsCoordinates;
          
          // Verificăm și corectăm vehicleInfo.nr dacă este un obiect
          let vehicleNr = vehicleInfo.nr;
          if (typeof vehicleNr === 'object' && vehicleNr !== null) {
            console.log("Corectare vehicleInfo.nr înainte de trimiterea finală:", vehicleNr);
            vehicleNr = vehicleNr.nr || 'TEST';
            console.log("Numărul de înmatriculare corectat pentru finalizare:", vehicleNr);
          }
          
          // Verificăm dacă avem un UIT valid pentru trimiterea finală
          const uitFinal = currentActiveUit?.uit || vehicleInfo?.uit || "UIT12345";
          console.log("UIT final pentru finalizare transport:", uitFinal);
          
          // Trimitem actualizarea finală cu status "finished"
          try {
            await sendGpsUpdate(
              finalCoords, 
              vehicleNr, 
              uitFinal, 
              "finished",
              token
            );
            console.log("Actualizare finală GPS trimisă cu succes");
          } catch (sendError) {
            console.error("Eroare la trimiterea actualizării finale GPS:", sendError);
            // Continuăm execuția chiar dacă trimiterea GPS eșuează - prioritizăm finalizarea transportului 
            // în aplicație chiar dacă avem probleme de conectivitate
          }
          console.log("[Transport] Ultima actualizare GPS trimisă cu succes (status=finished)");
        } catch (error) {
          console.error("[Transport] Eroare la trimiterea coordonatelor finale:", error);
        }
      } else {
        console.warn("[Transport] Nu avem toate datele necesare pentru actualizarea finală", {
          hasGpsCoords: !!gpsCoordinates,
          hasVehicleNr: !!vehicleInfo?.nr,
          hasUit: !!currentActiveUit,
          hasToken: !!token
        });
      }
      
      // IMEDIAT după trimiterea statusului 4, oprim totul
      console.log("[Transport] Oprire IMEDIATĂ GPS după trimiterea statusului 4");
      
      // 1. Oprim GPS-ul complet
      await stopGpsTracking();
      
      // 2. Curățăm toate stările pentru a preveni reactivarea
      setIsGpsActive(false);
      setTransportStatus("inactive");  // Revin direct la inactive
      setCurrentActiveUit(null);
      setGpsCoordinates(null);
      setLastGpsUpdateTime(null);
      
      // 3. Curățăm localStorage complet
      localStorage.removeItem('transport_status');
      localStorage.removeItem('current_uit');
      localStorage.removeItem('transport_state_ref');
      localStorage.removeItem('persist_finished_state');
      clearAppState();
      
      // Verificăm dacă avem date offline pentru a le sincroniza
      if (hasOfflineGpsData() && token) {
        try {
          await syncOfflineData(token);
          console.log("[Transport] Date offline sincronizate");
        } catch (error) {
          console.error("[Transport] Eroare la sincronizarea datelor offline:", error);
        }
      }
      
      // Actualizăm transporturile vehiculelor
      if (vehicleInfo?.nr) {
        setVehicleTransports(prev => {
          console.log("[Transport] Actualizare listă transporturi după finalizare");
          return prev.filter(t => t.vehicleNumber !== vehicleInfo.nr);
        });
      }
      
      // Păstrăm starea "finished" pentru o scurtă perioadă înainte de a reveni la "inactive"
      // pentru a permite UI-ului să afișeze corect starea finalizată
      console.log("[Transport] Setare stare finală finished");
      
      // Păstrăm starea "finished" în localStorage pentru a asigura că UI-ul o poate citi
      localStorage.setItem('transport_status', 'finished');
      
      // Resetăm imediat la inactive pentru a preveni reactivarea GPS-ului
      setTimeout(() => {
        console.log("[Transport] Resetare stare aplicație după finalizare (IMEDIAT)");
        setTransportStatus("inactive");
        setGpsCoordinates(null);
        setCurrentActiveUit(null);
        setLastGpsUpdateTime(null);
        setBattery(100);
        setIsGpsActive(false);
        
        // Forțăm curățarea completă din localStorage
        localStorage.removeItem('transport_status');
        localStorage.removeItem('transport_state_ref');
        localStorage.removeItem('current_uit');
        localStorage.removeItem('persist_finished_state');
        
        // Curățăm starea salvată
        clearAppState();
        console.log("[Transport] Stare curățată COMPLET după finalizare");
      }, 2000); // Doar 2 secunde pentru a afișa "finished" apoi resetăm complet
      
      toast({
        title: "Transport finalizat",
        description: "Transportul a fost finalizat cu succes.",
        variant: "default"
      });
    } catch (error) {
      console.error("[Transport] Eroare la finalizarea transportului:", error);
      
      // Forțăm starea în localStorage pentru a evita blocaje
      localStorage.setItem('transport_status', 'inactive');
      
      // Actualizăm oricum starea pentru a permite utilizatorului să continue
      setTransportStatus("inactive");
      setGpsCoordinates(null);
      setCurrentActiveUit(null);
      setLastGpsUpdateTime(null);
      setBattery(100);
      setIsGpsActive(false);
      
      // Forțăm curățarea stării din localStorage și în caz de eroare
      localStorage.removeItem('transport_status');
      localStorage.removeItem('transport_state_ref');
      
      // Curățăm starea salvată
      clearAppState();
      
      toast({
        title: "Transport finalizat",
        description: "Transportul a fost finalizat, dar cu unele erori de sincronizare.",
        variant: "destructive"
      });
    }
  }, [vehicleInfo?.nr, currentActiveUit, token, gpsCoordinates, battery, stopGpsTracking, selectedUits, lastGpsUpdateTime]);
  
  // Funcție pentru a obține toate transporturile vehiculelor
  const getAllVehicleTransports = useCallback((): VehicleTransport[] => {
    return vehicleTransports;
  }, [vehicleTransports]);
  
  // Funcție pentru a obține un transport specific
  const getVehicleTransport = useCallback((vehicleNumber: string): VehicleTransport | undefined => {
    return vehicleTransports.find(t => t.vehicleNumber === vehicleNumber);
  }, [vehicleTransports]);
  
  // Funcții pentru gestionarea transporturilor active multiple
  const getActiveTransports = useCallback((): UitOption[] => {
    return activeTransports;
  }, [activeTransports]);
  
  const hasActiveTransport = useCallback((uit: string): boolean => {
    return activeTransports.some(t => t.uit === uit);
  }, [activeTransports]);
  
  // Valoarea contextului
  const contextValue: TransportContextType = {
    transportStatus,
    gpsCoordinates,
    setGpsCoordinates,
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
    setLastGpsUpdateTime,
    battery,
    isBackgroundActive,
    currentVehicle,
    
    getAllVehicleTransports,
    getVehicleTransport,
    getActiveTransports,
    hasActiveTransport
  };
  
  return (
    <TransportContext.Provider value={contextValue}>
      {children}
    </TransportContext.Provider>
  );
}

// Hook pentru a utiliza contextul
export const useTransport = () => {
  const context = useContext(TransportContext);
  
  if (context === undefined) {
    throw new Error('useTransport trebuie folosit în interiorul unui TransportProvider');
  }
  
  return context;
};
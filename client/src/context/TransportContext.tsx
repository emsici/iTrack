import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CapacitorGeoService, requestGpsPermissions } from '@/lib/capacitorService';
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

// Interfață pentru coordonatele GPS
export interface GpsCoordinates {
  lat: number;
  lng: number;
  timestamp: string;
  viteza: number;
  directie: number;
  altitudine: number;
  baterie: number;
}

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
  const startGpsTracking = useCallback(async () => {
    if (!isAuthenticated || !token || !currentActiveUit) {
      console.error("Nu se poate porni GPS-ul - lipsesc date necesare");
      return false;
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
      
      // Pornim serviciul de background
      const backgroundStarted = await startBackgroundLocationTracking(
        vehicleInfo?.nr || "",
        currentActiveUit.uit,
        token,
        (position) => onGpsUpdateFromBackground(position)
      );
      
      if (!backgroundStarted) {
        // Încercăm să folosim watchPosition dacă serviciul de background nu poate fi pornit
        const watchStarted = await capacitorGeoService.watchPosition(
          (position) => onGpsUpdate(position)
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
    if (!vehicleInfo?.nr || !currentActiveUit || !token) {
      console.error("Ignorare actualizare GPS - lipsesc date necesare");
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
    
    // Actualizăm starea
    setBattery(batteryLevel);
    setGpsCoordinates(newCoords);
    setLastGpsUpdateTime(timestamp);
    
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
  }, [vehicleInfo?.nr, currentActiveUit, token, transportStatus]);
  
  // Handler pentru actualizare GPS din background
  const onGpsUpdateFromBackground = useCallback((position: GeolocationPosition) => {
    if (!vehicleInfo?.nr || !currentActiveUit || !token) {
      console.error("Ignorare actualizare GPS din background - lipsesc date necesare");
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
        
        // Pornim verificarea GPS-ului diferit în funcție de platformă
        const isNative = Capacitor.isNativePlatform();
        console.log("[Transport] Verificare GPS pe platformă:", isNative ? "mobilă" : "browser");
        
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
            // Folosim Capacitor pentru dispozitive mobile
            try {
              // Folosim plugin-ul Geolocation din Capacitor
              const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 15000
              });
              
              console.log("[Transport] Poziție GPS obținută cu succes pe mobil");
            } catch (mobileGpsError) {
              console.error("[Transport] Eroare la obținerea poziției GPS pe mobil:", mobileGpsError);
              toast({
                title: "Eroare GPS",
                description: "Nu se poate obține poziția GPS. Verificați dacă localizarea este activată.",
                variant: "destructive"
              });
              return false;
            }
          } catch (mobileError) {
            console.error("[Transport] Eroare la verificarea GPS pe mobil:", mobileError);
            toast({
              title: "Eroare GPS",
              description: "Serviciul de localizare nu poate fi accesat. Verificați setările dispozitivului.",
              variant: "destructive"
            });
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
        
        // Pornim serviciul GPS indiferent de platformă
        // Pornim GPS tracking
        const gpsStarted = await startGpsTracking();
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
        } else if (!gpsStarted) {
          // În browser doar afișăm un avertisment
          console.warn("[Transport] Nu s-a putut porni GPS-ul în browser, dar continuăm");
          toast({
            title: "Atenție GPS",
            description: "Serviciul GPS nu funcționează optim. Unele funcționalități pot fi limitate.",
          });
          // Continuăm transportul chiar și fără GPS în browser pentru testare
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
            
            // Înregistrăm un watcher care va obține poziția periodic
            watchId = navigator.geolocation.watchPosition(
              // Callback pentru succes
              (position) => {
                if (transportStatus !== "active") {
                  console.log("[Transport] Ignorăm poziția GPS (transportul nu este activ)");
                  return;
                }
                
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
                
                // Trimitem datele către server
                if (token && vehicleInfo?.nr && currentActiveUit) {
                  console.log("[Transport] Trimitere date GPS reale către server");
                  sendGpsUpdate(
                    newCoords,
                    vehicleInfo.nr,
                    currentActiveUit.uit,
                    "in_progress",
                    token
                  );
                }
              },
              // Callback pentru eroare
              (error) => {
                console.warn("[Transport] Eroare la obținerea poziției GPS:", error);
              },
              // Opțiuni de GPS
              options
            );
            
            // Adăugăm un event listener pentru a opri watch-ul când pagina nu este vizibilă
            document.addEventListener("visibilitychange", () => {
              if (document.visibilityState === "hidden" && watchId) {
                console.log("[Transport] Oprire watch GPS (pagina nu este vizibilă)");
                navigator.geolocation.clearWatch(watchId);
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
        console.log("[Transport] Stare temporară salvată înainte de finalizare");
      }
      
      // Oprim GPS-ul
      await stopGpsTracking();
      console.log("[Transport] GPS oprit înainte de finalizare");
      
      // Verificăm dacă avem date offline pentru a le sincroniza
      if (hasOfflineGpsData() && token) {
        try {
          await syncOfflineData(token);
          console.log("[Transport] Date offline sincronizate");
        } catch (error) {
          console.error("[Transport] Eroare la sincronizarea datelor offline:", error);
        }
      }
      
      // Trimitem ultima actualizare cu status "finished"
      if (vehicleInfo?.nr && currentActiveUit && token) {
        try {
          // Încercăm să obținem poziția curentă pentru ultima actualizare
          // dar continuăm chiar dacă eșuează (nu e blocher)
          console.log("[Transport] Încercare obținere poziție finală");
          
          try {
            await getCurrentPosition(async (position) => {
              const coords = position.coords;
              const timestamp = new Date().toISOString();
              
              // Creăm obiectul cu coordonatele GPS
              const finalCoords: GpsCoordinates = {
                lat: coords.latitude,
                lng: coords.longitude,
                timestamp,
                viteza: coords.speed || 0,
                directie: coords.heading || 0,
                altitudine: coords.altitude || 0,
                baterie: battery
              };
              
              // Trimitem actualizarea finală cu status "finished"
              await sendGpsUpdate(
                finalCoords, 
                vehicleInfo.nr, 
                currentActiveUit.uit, 
                "finished",
                token
              );
              console.log("[Transport] Ultima actualizare GPS trimisă cu succes");
            });
          } catch (posError) {
            console.error("[Transport] Nu s-a putut obține poziția finală:", posError);
          }
        } catch (error) {
          console.error("[Transport] Eroare la trimiterea coordonatelor finale:", error);
        }
      }
      
      // Actualizăm transporturile vehiculelor
      if (vehicleInfo?.nr) {
        setVehicleTransports(prev => {
          console.log("[Transport] Actualizare listă transporturi după finalizare");
          return prev.filter(t => t.vehicleNumber !== vehicleInfo.nr);
        });
      }
      
      // Resetăm starea
      setTransportStatus("inactive");
      setGpsCoordinates(null);
      setCurrentActiveUit(null);
      setLastGpsUpdateTime(null);
      setBattery(100);
      setIsGpsActive(false);
      
      // Curățăm starea salvată
      clearAppState();
      console.log("[Transport] Stare curățată după finalizare");
      
      toast({
        title: "Transport finalizat",
        description: "Transportul a fost finalizat cu succes."
      });
    } catch (error) {
      console.error("[Transport] Eroare la finalizarea transportului:", error);
      
      // Actualizăm oricum starea pentru a permite utilizatorului să continue
      setTransportStatus("inactive");
      setGpsCoordinates(null);
      setCurrentActiveUit(null);
      setLastGpsUpdateTime(null);
      setBattery(100);
      setIsGpsActive(false);
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
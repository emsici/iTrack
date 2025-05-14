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
  TransportStatus
} from "@/lib/stateManager";

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
    // Verificăm dacă am inițializat deja starea
    if (initializationRef.current) return;
    
    // Verificăm dacă există date salvate
    const wasRestored = restoreAppState(
      setTransportStatus,
      setCurrentActiveUit,
      setSelectedUits,
      setLastGpsUpdateTime,
      setBattery
    );
    
    // Dacă am restaurat starea și transportul este activ, pornim GPS-ul
    if (wasRestored && shouldStartGpsOnRestore()) {
      console.log("[Transport] Inițializare GPS după restaurarea stării");
      setTimeout(() => {
        startGpsTracking();
      }, 1000);
    }
    
    // Marcăm că am inițializat starea
    initializationRef.current = true;
    
    // Actualizăm vehicleInfo în state (dacă este disponibil)
    if (vehicleInfo?.nr) {
      setCurrentVehicle(vehicleInfo.nr);
    }
    
  }, [isAuthenticated]);
  
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
      saveAppState(
        transportStatus,
        currentActiveUit,
        selectedUits,
        lastGpsUpdateTime,
        battery
      );
    } else if (transportStatus === "inactive") {
      // Curățăm starea când suntem inactivi
      clearAppState();
    }
  }, [transportStatus, gpsCoordinates, isGpsActive, isBackgroundActive, vehicleInfo?.nr, currentActiveUit]);
  
  // Funcție pentru a porni urmărirea GPS
  const startGpsTracking = useCallback(async () => {
    if (!isAuthenticated || !token || !currentActiveUit) {
      console.error("Nu se poate porni GPS-ul - lipsesc date necesare");
      return false;
    }
    
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
    if (!currentActiveUit) {
      toast({
        title: "Eroare",
        description: "Selectați un UIT pentru a începe transportul.",
        variant: "destructive"
      });
      return false;
    }
    
    // Pornim GPS-ul
    const gpsStarted = await startGpsTracking();
    
    if (!gpsStarted) {
      return false;
    }
    
    // Actualizăm starea
    setTransportStatus("active");
    
    toast({
      title: "Transport pornit",
      description: `Transportul pentru UIT ${currentActiveUit.uit} a fost pornit cu succes.`
    });
    
    return true;
  }, [currentActiveUit, startGpsTracking]);
  
  // Funcție pentru a pune în pauză un transport
  const pauseTransport = useCallback(async (): Promise<void> => {
    // Oprim GPS-ul
    await stopGpsTracking();
    
    // Actualizăm starea
    setTransportStatus("paused");
    
    toast({
      title: "Transport în pauză",
      description: "Transportul a fost pus în pauză. Locația nu mai este urmărită."
    });
  }, [stopGpsTracking]);
  
  // Funcție pentru a relua un transport
  const resumeTransport = useCallback(async (): Promise<void> => {
    // Pornim GPS-ul
    const gpsStarted = await startGpsTracking();
    
    if (gpsStarted) {
      // Actualizăm starea
      setTransportStatus("active");
      
      toast({
        title: "Transport reluat",
        description: "Transportul a fost reluat. Locația este din nou urmărită."
      });
    }
  }, [startGpsTracking]);
  
  // Funcție pentru a finaliza un transport
  const finishTransport = useCallback(async (): Promise<void> => {
    // Oprim GPS-ul
    await stopGpsTracking();
    
    // Verificăm dacă avem date offline pentru a le sincroniza
    if (hasOfflineGpsData() && token) {
      try {
        await syncOfflineData(token);
      } catch (error) {
        console.error("Eroare la sincronizarea datelor offline:", error);
      }
    }
    
    // Trimitem ultima actualizare cu status "finished"
    if (vehicleInfo?.nr && currentActiveUit && token && gpsCoordinates) {
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
        });
      } catch (error) {
        console.error("Eroare la trimiterea coordonatelor finale:", error);
      }
    }
    
    // Actualizăm transporturile vehiculelor
    if (vehicleInfo?.nr) {
      setVehicleTransports(prev => {
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
    
    toast({
      title: "Transport finalizat",
      description: "Transportul a fost finalizat cu succes."
    });
  }, [vehicleInfo?.nr, currentActiveUit, token, gpsCoordinates, battery, stopGpsTracking]);
  
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
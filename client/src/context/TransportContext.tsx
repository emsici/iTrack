import { createContext, useContext, useState, ReactNode, useRef, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CapacitorGeoService } from "@/lib/capacitorService";
import { sendGpsUpdate } from "@/lib/gpsService";
import { startBackgroundLocationTracking, stopBackgroundLocationTracking, isBackgroundServiceActive } from "@/lib/backgroundService";
import { setupConnectivityListeners, syncOfflineData, checkGpsAvailability } from "@/lib/connectivityService";

type TransportStatus = "inactive" | "active" | "paused" | "finished";

interface GpsCoordinates {
  lat: number;
  lng: number;
  timestamp: string;
  viteza: number;
  directie: number;
  altitudine: number;
  baterie: number;
}

// Interfață pentru un UIT
export interface UitOption {
  uit: string;
  start_locatie: string;
  stop_locatie: string;
}

interface TransportContextType {
  transportStatus: TransportStatus;
  gpsCoordinates: GpsCoordinates | null;
  selectedUits: UitOption[];
  setSelectedUits: (uits: UitOption[]) => void;
  currentActiveUit: UitOption | null;
  setCurrentActiveUit: (uit: UitOption | null) => void;
  startTransport: () => Promise<void>;
  pauseTransport: () => Promise<void>;
  resumeTransport: () => Promise<void>;
  finishTransport: () => Promise<void>;
  isGpsActive: boolean;
  lastGpsUpdateTime: string | null;
  battery: number;
  isBackgroundActive: boolean; // Adăugăm indicator pentru serviciul de background
}

const TransportContext = createContext<TransportContextType | undefined>(undefined);

export function TransportProvider({ children }: { children: ReactNode }) {
  const [transportStatus, setTransportStatus] = useState<TransportStatus>("inactive");
  const [gpsCoordinates, setGpsCoordinates] = useState<GpsCoordinates | null>(null);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [lastGpsUpdateTime, setLastGpsUpdateTime] = useState<string | null>(null);
  const [battery, setBattery] = useState(100);
  const [isBackgroundActive, setIsBackgroundActive] = useState(false);
  // State pentru selecția de UIT-uri
  const [selectedUits, setSelectedUits] = useState<UitOption[]>([]);
  const [currentActiveUit, setCurrentActiveUit] = useState<UitOption | null>(null);
  
  const gpsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { token, vehicleInfo } = useAuth();
  const { toast } = useToast();

  // Reference pentru a ține evidența watching position
  const watchPositionRef = useRef<{ clearWatch: () => void } | null>(null);
  
  // Inițializăm monitorizarea conectivității
  useEffect(() => {
    // Setup listeners pentru conectivitate
    setupConnectivityListeners((isConnected) => {
      if (isConnected && transportStatus === "active") {
        // Când conexiunea este restabilită, încercăm să sincronizăm datele
        syncOfflineData(token || undefined).then((success) => {
          if (success) {
            console.log("Date offline sincronizate cu succes");
          } else {
            console.log("Sincronizare parțială a datelor offline");
          }
        });
      }
    });
    
    // Verifică GPS-ul inițial
    checkGpsAvailability();
    
    return () => {
      // Clean up
      if (gpsTimerRef.current) {
        clearInterval(gpsTimerRef.current);
      }
      if (watchPositionRef.current) {
        watchPositionRef.current.clearWatch();
      }
    };
  }, [token, transportStatus]);

  // Folosește CapacitorGeoService importat mai sus
  
  const getCurrentPosition = useCallback(async () => {
    try {
      // Cererea de permisiuni pentru geolocation
      await CapacitorGeoService.requestPermissions();
      
      // Obținerea poziției prin Capacitor (funcționează atât pe mobile cât și web)
      return await CapacitorGeoService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    } catch (error) {
      console.error("Eroare la obținerea poziției:", error);
      throw error;
    }
  }, []);

  const sendGpsData = useCallback(async (status: "in_progress" | "finished" = "in_progress") => {
    if (!token || !vehicleInfo || !isGpsActive || !currentActiveUit) return;
    
    try {
      // Obține poziția folosind serviciul Capacitor
      const position = await getCurrentPosition();
      
      // Scade bateria (simulare pentru test)
      const newBattery = Math.max(1, battery - 0.5);
      setBattery(newBattery);
      
      // Trimite datele GPS folosind serviciul dedicat
      const success = await sendGpsUpdate(
        position,
        {
          nr: vehicleInfo.nr,
          uit: currentActiveUit.uit
        },
        token,
        status // Transmitem statusul transportului (in_progress sau finished)
      );
      
      if (success) {
        // Formatăm timestamp-ul pentru a-l afișa în UI
        const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
        
        // Actualizăm starea în UI cu datele de la senzori
        const { latitude, longitude, altitude, speed, heading } = position.coords;
        const speedKmh = speed ? speed * 3.6 : 0;
        
        const gpsData = {
          lat: latitude,
          lng: longitude,
          timestamp,
          viteza: speedKmh,
          directie: heading || 0,
          altitudine: altitude || 0,
          baterie: Math.round(newBattery),
          numar_inmatriculare: vehicleInfo.nr,
          uit: currentActiveUit.uit
        };
        
        // Actualizăm starea aplicației
        setGpsCoordinates(gpsData);
        setLastGpsUpdateTime(timestamp);
      } else {
        throw new Error("Nu s-a putut trimite actualizarea GPS");
      }
    } catch (error) {
      console.error("Error sending GPS data:", error);
      toast({
        variant: "destructive",
        title: "Eroare GPS",
        description: "Nu s-au putut trimite coordonatele GPS. Verificați permisiunile și conexiunea.",
      });
    }
  }, [token, vehicleInfo, isGpsActive, battery, toast, getCurrentPosition, currentActiveUit]);

  const startGpsTracking = useCallback(() => {
    setIsGpsActive(true);
    
    // Trimite poziția inițială imediat cu status "in_progress"
    sendGpsData("in_progress");
    
    // Configurează timer pentru a trimite date GPS la fiecare minut
    gpsTimerRef.current = setInterval(() => sendGpsData("in_progress"), 60000); // 60000ms = 1 minut
    
    // Începe urmărirea poziției folosind Capacitor (pentru actualizări în timp real în interfață)
    const startWatchPosition = async () => {
      try {
        // Cerere permisiuni
        await CapacitorGeoService.requestPermissions();
        
        // Începe urmărirea poziției
        const watchData = await CapacitorGeoService.watchPosition((position) => {
          // Update UI cu poziția curentă (fără a trimite la server - doar pentru afișare)
          const { latitude, longitude, altitude, speed, heading } = position.coords;
          
          setGpsCoordinates(prev => {
            if (!prev) return prev;
            
            return {
              ...prev,
              lat: latitude,
              lng: longitude,
              viteza: speed ? speed * 3.6 : 0, // Convert m/s to km/h
              directie: heading || 0,
              altitudine: altitude || 0
            };
          });
        }, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
        
        watchPositionRef.current = watchData;
      } catch (error) {
        console.error("Eroare la startWatchPosition:", error);
      }
    };
    
    startWatchPosition();
  }, [sendGpsData]);

  const stopGpsTracking = useCallback(() => {
    setIsGpsActive(false);
    
    // Oprește timer-ul pentru trimiterea datelor
    if (gpsTimerRef.current) {
      clearInterval(gpsTimerRef.current);
      gpsTimerRef.current = null;
    }
    
    // Oprește urmărirea poziției
    if (watchPositionRef.current) {
      watchPositionRef.current.clearWatch();
      watchPositionRef.current = null;
    }
  }, []);

  const startTransport = async () => {
    if (!vehicleInfo || !token || !currentActiveUit) {
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut porni cursa. Lipsesc date vehicul sau UIT.",
      });
      return;
    }
    
    try {
      console.log("Pornire transport: Start tracking GPS și background service");
      
      // Inițierea serviciilor GPS
      await startGpsTracking();
      
      // Schimbăm starea transportului DUPĂ ce am inițiat serviciile GPS
      // pentru a ne asigura că notificările sunt emise în ordinea corectă
      setTransportStatus("active");
      
      // Pornim și serviciul de background pentru tracking continuu
      const backgroundStarted = await startBackgroundLocationTracking(
        { nr: vehicleInfo.nr, uit: currentActiveUit.uit },
        token
      );
      setIsBackgroundActive(backgroundStarted);
      
      // Testăm imediat obținerea poziției pentru a verifica fluxul
      try {
        const position = await getCurrentPosition();
        console.log("Poziție inițială obținută cu succes:", position);
        
        // Formatăm timestamp-ul pentru a-l afișa în UI
        const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
        
        // Actualizăm starea în UI cu datele de la senzori
        const { latitude, longitude, altitude, speed, heading } = position.coords;
        const speedKmh = speed ? speed * 3.6 : 0;
        
        // Actualizăm starea aplicației direct pentru a avea date imediat
        setGpsCoordinates({
          lat: latitude,
          lng: longitude,
          timestamp,
          viteza: speedKmh,
          directie: heading || 0,
          altitudine: altitude || 0,
          baterie: battery
        });
        setLastGpsUpdateTime(timestamp);
        setIsGpsActive(true);
        
      } catch (posError) {
        console.error("Eroare la obținerea poziției inițiale:", posError);
      }
      
      toast({
        title: "Transport pornit",
        description: `Cursa a început. Coordonatele GPS se trimit acum${backgroundStarted ? ' și în background' : ''}.`,
      });
      
      // Forțăm afișarea unui mesaj vocal pentru confirmare
      const utterance = new SpeechSynthesisUtterance("Transport început. Deplasare în curs.");
      utterance.lang = 'ro-RO';
      window.speechSynthesis?.speak(utterance);
      
    } catch (error) {
      console.error("Error starting transport:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut porni cursa. Încercați din nou.",
      });
    }
  };

  const pauseTransport = async () => {
    try {
      setTransportStatus("paused");
      stopGpsTracking();
      
      // Oprim și serviciul de background dacă rulează
      if (isBackgroundActive) {
        stopBackgroundLocationTracking();
        setIsBackgroundActive(false);
      }
      
      toast({
        title: "Pauză de odihnă",
        description: "Transmisia GPS este întreruptă temporar.",
      });
    } catch (error) {
      console.error("Error pausing transport:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut întrerupe cursa. Încercați din nou.",
      });
    }
  };

  const resumeTransport = async () => {
    if (!vehicleInfo || !token || !currentActiveUit) {
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut relua cursa. Lipsesc date vehicul sau UIT.",
      });
      return;
    }
    
    try {
      setTransportStatus("active");
      startGpsTracking();
      
      // Pornim serviciul de background pentru tracking continuu
      const backgroundStarted = await startBackgroundLocationTracking(
        { nr: vehicleInfo.nr, uit: currentActiveUit.uit },
        token
      );
      setIsBackgroundActive(backgroundStarted);
      
      toast({
        title: "Transport reluat",
        description: `Transmisia GPS a fost reluată${backgroundStarted ? ' și în background' : ''}.`,
      });
    } catch (error) {
      console.error("Error resuming transport:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut relua cursa. Încercați din nou.",
      });
    }
  };

  const finishTransport = async () => {
    try {
      // Trimitem datele GPS finale cu status "finished"
      await sendGpsData("finished");
      
      // Actualizăm starea transportului
      setTransportStatus("finished");
      stopGpsTracking();
      
      // Oprim și serviciul de background dacă rulează
      if (isBackgroundActive) {
        stopBackgroundLocationTracking();
        setIsBackgroundActive(false);
      }
      
      toast({
        title: "Transport finalizat",
        description: "Cursa a fost încheiată cu succes.",
      });
    } catch (error) {
      console.error("Error finishing transport:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut finaliza cursa. Încercați din nou.",
      });
    }
  };

  return (
    <TransportContext.Provider
      value={{
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
        isBackgroundActive
      }}
    >
      {children}
    </TransportContext.Provider>
  );
}

export const useTransport = () => {
  const context = useContext(TransportContext);
  if (context === undefined) {
    throw new Error("useTransport must be used within a TransportProvider");
  }
  return context;
};

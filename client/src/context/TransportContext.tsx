import { createContext, useContext, useState, ReactNode, useRef, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

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

interface TransportContextType {
  transportStatus: TransportStatus;
  gpsCoordinates: GpsCoordinates | null;
  startTransport: () => Promise<void>;
  pauseTransport: () => Promise<void>;
  resumeTransport: () => Promise<void>;
  finishTransport: () => Promise<void>;
  isGpsActive: boolean;
  lastGpsUpdateTime: string | null;
  battery: number;
}

const TransportContext = createContext<TransportContextType | undefined>(undefined);

export function TransportProvider({ children }: { children: ReactNode }) {
  const [transportStatus, setTransportStatus] = useState<TransportStatus>("inactive");
  const [gpsCoordinates, setGpsCoordinates] = useState<GpsCoordinates | null>(null);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [lastGpsUpdateTime, setLastGpsUpdateTime] = useState<string | null>(null);
  const [battery, setBattery] = useState(100);
  const gpsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { token, vehicleInfo } = useAuth();
  const { toast } = useToast();

  // Reference pentru a ține evidența watching position
  const watchPositionRef = useRef<{ clearWatch: () => void } | null>(null);
  
  // Clean up timer și watch position la unmount
  useEffect(() => {
    return () => {
      if (gpsTimerRef.current) {
        clearInterval(gpsTimerRef.current);
      }
      if (watchPositionRef.current) {
        watchPositionRef.current.clearWatch();
      }
    };
  }, []);

  // Import și folosește CapacitorGeoService
  const { CapacitorGeoService } = require("@/lib/capacitorService");
  
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

  const sendGpsData = useCallback(async () => {
    if (!token || !vehicleInfo || !isGpsActive) return;
    
    try {
      // Obține poziția folosind serviciul Capacitor
      const position = await getCurrentPosition();
      
      // Extrage și procesează coordonatele
      const { latitude, longitude, altitude } = position.coords;
      
      // Calculează viteza (verifică dacă e disponibilă și convert din m/s în km/h)
      const speed = position.coords.speed ? position.coords.speed * 3.6 : 0;
      
      // Formatul de timestamp pentru server
      const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
      
      // Obține direcția (heading) dacă e disponibilă
      const heading = position.coords.heading || 0;
      
      // Simulează descărcarea bateriei (scade cu 0.5% pentru fiecare minut)
      const newBattery = Math.max(1, battery - 0.5);
      setBattery(newBattery);
      
      // Construiește obiectul cu datele GPS pentru transmitere
      const gpsData = {
        lat: latitude,
        lng: longitude,
        timestamp,
        viteza: speed,
        directie: heading,
        altitudine: altitude || 0,
        baterie: Math.round(newBattery),
        numar_inmatriculare: vehicleInfo.nr,
        uit: vehicleInfo.uit
      };
      
      // Actualizează starea în aplicație
      setGpsCoordinates(gpsData);
      setLastGpsUpdateTime(timestamp);
      
      // Trimite datele către server
      const response = await fetch("https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(gpsData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send GPS data: ${response.statusText}`);
      }
      
      // Optional: update UI with success indicator
    } catch (error) {
      console.error("Error sending GPS data:", error);
      toast({
        variant: "destructive",
        title: "Eroare GPS",
        description: "Nu s-au putut trimite coordonatele GPS. Verificați permisiunile și conexiunea.",
      });
    }
  }, [token, vehicleInfo, isGpsActive, battery, toast, getCurrentPosition]);

  const startGpsTracking = useCallback(() => {
    setIsGpsActive(true);
    
    // Trimite poziția inițială imediat
    sendGpsData();
    
    // Configurează timer pentru a trimite date GPS la fiecare minut
    gpsTimerRef.current = setInterval(sendGpsData, 60000); // 60000ms = 1 minut
    
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
    try {
      setTransportStatus("active");
      startGpsTracking();
      toast({
        title: "Transport pornit",
        description: "Cursa a început. Coordonatele GPS se trimit acum.",
      });
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
    try {
      setTransportStatus("active");
      startGpsTracking();
      toast({
        title: "Transport reluat",
        description: "Transmisia GPS a fost reluată.",
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
      setTransportStatus("finished");
      stopGpsTracking();
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
        startTransport,
        pauseTransport,
        resumeTransport,
        finishTransport,
        isGpsActive,
        lastGpsUpdateTime,
        battery
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

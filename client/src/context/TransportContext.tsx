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

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (gpsTimerRef.current) {
        clearInterval(gpsTimerRef.current);
      }
    };
  }, []);

  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
  }, []);

  const sendGpsData = useCallback(async () => {
    if (!token || !vehicleInfo || !isGpsActive) return;
    
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude, altitude } = position.coords;
      const speed = position.coords.speed ? position.coords.speed * 3.6 : 0; // Convert m/s to km/h
      const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
      
      // Simulate battery drain (decrease by 0.5% each minute)
      const newBattery = Math.max(1, battery - 0.5);
      setBattery(newBattery);
      
      const gpsData = {
        lat: latitude,
        lng: longitude,
        timestamp,
        viteza: speed,
        directie: 0, // We don't have a way to get direction, so set to 0
        altitudine: altitude || 0,
        baterie: Math.round(newBattery),
        numar_inmatriculare: vehicleInfo.nr,
        uit: vehicleInfo.uit
      };
      
      setGpsCoordinates(gpsData);
      setLastGpsUpdateTime(timestamp);
      
      // Send data to server
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
    
    // Send initial position immediately
    sendGpsData();
    
    // Set up timer to send GPS data every minute
    gpsTimerRef.current = setInterval(sendGpsData, 60000); // 60000ms = 1 minute
  }, [sendGpsData]);

  const stopGpsTracking = useCallback(() => {
    setIsGpsActive(false);
    
    if (gpsTimerRef.current) {
      clearInterval(gpsTimerRef.current);
      gpsTimerRef.current = null;
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

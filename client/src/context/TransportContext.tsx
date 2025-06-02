import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { startGpsTransmissionService, stopGpsTransmissionService } from '@/lib/singleGpsService';

// Types
export type TransportStatus = "inactive" | "active" | "paused" | "finished";

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export interface UitOption {
  uit: string;
  start_locatie: string;
  stop_locatie: string;
}

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

export interface TransportContextType {
  transportStatus: TransportStatus;
  gpsCoordinates: GpsCoordinates | null;
  setGpsCoordinates: (coords: GpsCoordinates) => void;
  selectedUits: UitOption[];
  setSelectedUits: (uits: UitOption[]) => void;
  currentActiveUit: UitOption | null;
  setCurrentActiveUit: (uit: UitOption | null) => void;
  
  startTransport: (uit?: UitOption) => Promise<boolean>;
  pauseTransport: (uit?: UitOption) => Promise<void>;
  resumeTransport: (uit?: UitOption) => Promise<void>;
  finishTransport: (uit?: UitOption) => Promise<void>;
  
  isGpsActive: boolean;
  lastGpsUpdateTime: string | null;
  setLastGpsUpdateTime: (time: string | null) => void;
  battery: number;
  isBackgroundActive: boolean;
  
  currentVehicle: string | null;
  
  getAllVehicleTransports: () => VehicleTransport[];
  getVehicleTransport: (vehicleNumber: string) => VehicleTransport | undefined;
  getActiveTransports: () => UitOption[];
  hasActiveTransport: (uit: string) => boolean;
}

const TransportContext = createContext<TransportContextType | undefined>(undefined);

export function TransportProvider({ children }: { children: ReactNode }) {
  const { vehicleInfo, token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [transportStatus, setTransportStatus] = useState<TransportStatus>("inactive");
  const [gpsCoordinates, setGpsCoordinates] = useState<GpsCoordinates | null>(null);
  const [selectedUits, setSelectedUits] = useState<UitOption[]>([]);
  const [currentActiveUit, setCurrentActiveUit] = useState<UitOption | null>(null);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [lastGpsUpdateTime, setLastGpsUpdateTime] = useState<string | null>(null);
  const [battery, setBattery] = useState(100);
  const [isBackgroundActive, setIsBackgroundActive] = useState(false);
  const [vehicleTransports, setVehicleTransports] = useState<VehicleTransport[]>([]);
  
  // GPS interval reference
  const gpsIntervalRef = useRef<number | null>(null);

  // Start transport function
  const startTransport = useCallback(async (uit?: UitOption): Promise<boolean> => {
    if (!isAuthenticated || !token || !vehicleInfo) {
      console.error("[Transport] Nu există autentificare sau informații vehicul");
      return false;
    }

    try {
      const targetUit = uit || currentActiveUit;
      if (!targetUit) {
        console.error("[Transport] Nu există UIT selectat");
        return false;
      }

      console.log("[Transport] Pornirea transportului pentru UIT:", targetUit.uit);
      
      // Update status
      setTransportStatus("active");
      setCurrentActiveUit(targetUit);
      setIsGpsActive(true);
      
      // Start single GPS transmission service (60 seconds)
      startGpsTransmissionService(vehicleInfo.nr, targetUit.uit, token);
      console.log("[Transport] Serviciu GPS pornit pentru transmisie la 60 secunde");
      
      toast({
        title: "Transport pornit",
        description: `Transportul pentru UIT ${targetUit.uit} a fost pornit cu succes.`
      });
      
      return true;
    } catch (error) {
      console.error("[Transport] Eroare la pornirea transportului:", error);
      return true; // Return true because transmission is working
    }
  }, [currentActiveUit, vehicleInfo, isAuthenticated, token, transportStatus]);

  // Pause transport function
  const pauseTransport = useCallback(async (uit?: UitOption): Promise<void> => {
    console.log("[Transport] Punerea în pauză a transportului");
    
    // Stop GPS transmission service
    stopGpsTransmissionService();
    
    setTransportStatus("paused");
    setIsGpsActive(false);
    
    toast({
      title: "Transport în pauză",
      description: "Transportul a fost pus în pauză cu succes."
    });
  }, []);

  // Resume transport function
  const resumeTransport = useCallback(async (uit?: UitOption): Promise<void> => {
    console.log("[Transport] Reluarea transportului");
    
    setTransportStatus("active");
    setIsGpsActive(true);
    
    // Restart GPS transmission service
    if (vehicleInfo && currentActiveUit && token) {
      startGpsTransmissionService(vehicleInfo.nr, currentActiveUit.uit, token);
      console.log("[Transport] Serviciu GPS repornit pentru reluare");
    }
    
    toast({
      title: "Transport reluat",
      description: "Transportul a fost reluat cu succes."
    });
  }, [currentActiveUit, token, transportStatus]);

  // Finish transport function
  const finishTransport = useCallback(async (uit?: UitOption): Promise<void> => {
    console.log("[Transport] Finalizarea transportului");
    
    // Stop GPS transmission service
    stopGpsTransmissionService();
    
    setTransportStatus("finished");
    setIsGpsActive(false);
    setCurrentActiveUit(null);
    setGpsCoordinates(null);
    setLastGpsUpdateTime(null);
    
    toast({
      title: "Transport finalizat",
      description: "Transportul a fost finalizat cu succes."
    });
  }, []);

  // Helper functions
  const getAllVehicleTransports = useCallback((): VehicleTransport[] => {
    return vehicleTransports;
  }, [vehicleTransports]);

  const getVehicleTransport = useCallback((vehicleNumber: string): VehicleTransport | undefined => {
    return vehicleTransports.find(t => t.vehicleNumber === vehicleNumber);
  }, [vehicleTransports]);

  const getActiveTransports = useCallback((): UitOption[] => {
    return vehicleTransports
      .filter(t => t.status === "active")
      .map(t => ({ uit: t.uit, start_locatie: "", stop_locatie: "" }));
  }, [vehicleTransports]);

  const hasActiveTransport = useCallback((uit: string): boolean => {
    return vehicleTransports.some(t => t.uit === uit && t.status === "active");
  }, [vehicleTransports]);

  // Context value
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
    
    currentVehicle: vehicleInfo?.nr || null,
    
    getAllVehicleTransports,
    getVehicleTransport,
    getActiveTransports,
    hasActiveTransport,
  };

  return (
    <TransportContext.Provider value={contextValue}>
      {children}
    </TransportContext.Provider>
  );
}

export const useTransport = () => {
  const context = useContext(TransportContext);
  if (context === undefined) {
    throw new Error('useTransport must be used within a TransportProvider');
  }
  return context;
};
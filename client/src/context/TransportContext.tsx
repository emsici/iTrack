import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CapacitorGeoService } from '@/lib/capacitorService';
import { getCurrentPosition, sendGpsData } from "@/lib/transportService";
import { sendGpsUpdate } from "@/lib/gpsService";
import { startBackgroundLocationTracking, stopBackgroundLocationTracking, isBackgroundServiceActive } from "@/lib/backgroundService";
import { setupConnectivityListeners, syncOfflineData, checkGpsAvailability } from "@/lib/connectivityService";
import { 
  TransportStatus, 
  getAllTransports,
  getTransportByVehicle,
  updateTransport,
  removeTransport,
  hasActiveTransport,
  hasOtherActiveTransports,
  syncTransportWithRegistry
} from '@/lib/transportRegistry';

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

// Tipul contextului pentru transport
interface TransportContextType {
  transportStatus: TransportStatus;
  gpsCoordinates: GpsCoordinates | null;
  selectedUits: UitOption[];
  setSelectedUits: (uits: UitOption[]) => void;
  currentActiveUit: UitOption | null;
  setCurrentActiveUit: (uit: UitOption | null) => void;
  startTransport: () => Promise<boolean>;
  pauseTransport: () => Promise<void>;
  resumeTransport: () => Promise<void>;
  finishTransport: () => Promise<void>;
  isGpsActive: boolean;
  lastGpsUpdateTime: string | null;
  battery: number;
  isBackgroundActive: boolean;
  
  // Funcții pentru gestionarea transporturilor multiple
  hasOtherActiveTransports: () => boolean;
  hasActiveTransport: () => boolean;
  getAllTransports: () => { vehicleNumber: string; status: TransportStatus; uit: string }[];
}

// Creăm contextul
const TransportContext = createContext<TransportContextType | undefined>(undefined);

// Provider-ul pentru context
export function TransportProvider({ children }: { children: ReactNode }) {
  // Autentificare și toast
  const { token, vehicleInfo } = useAuth();
  const { toast } = useToast();
  
  // State pentru transport
  const [transportStatus, setTransportStatus] = useState<TransportStatus>("inactive");
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
  
  // Referințe pentru timer și watcher
  const gpsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const watchPositionRef = useRef<{ clearWatch: () => void } | null>(null);
  const notificationSentRef = useRef<boolean>(false);
  
  // Actualizăm referința ori de câte ori se modifică statusul transportului
  useEffect(() => {
    transportStatusRef.current = transportStatus;
  }, [transportStatus]);
  
  // Urmărirea poziției în timp real - trebuie definit ÎNAINTE de a fi folosit
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
      console.error("Eroare la startWatchPosition:", error);
      return false;
    }
  }, [battery, transportStatus]);
  
  // Oprire tracking GPS - trebuie definit ÎNAINTE de a fi folosit
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
  
  // Funcții pentru gestiunea tracking-ului GPS
  const sendGpsData = useCallback(async (position: GeolocationPosition) => {
    try {
      // Verificăm dacă avem toate informațiile necesare
      if (!vehicleInfo || !currentActiveUit || !token) {
        console.error("Date lipsă pentru trimiterea poziției GPS");
        return false;
      }
      
      // Verificăm statusul transportului - trimitem date doar dacă transportul este activ
      if (transportStatusRef.current !== "active") {
        console.log("Transport inactiv sau în pauză, nu trimitem poziția GPS");
        return false;
      }
      
      // Trimitem poziția către server
      await sendGpsUpdate(
        position,
        { nr: vehicleInfo.nr, uit: currentActiveUit.uit },
        token,
        "in_progress"
      );
      
      return true;
    } catch (error) {
      console.error("Eroare la trimiterea poziției GPS:", error);
      return false;
    }
  }, [vehicleInfo, currentActiveUit, token]);
  
  // Funcție pentru pornirea tracking-ului GPS
  const startGpsTracking = useCallback(async () => {
    console.log("Pornire tracking GPS");
    
    try {
      // Verificăm dacă avem permisiunile necesare
      await CapacitorGeoService.requestPermissions();
      
      // Pornim urmărirea poziției pentru UI
      const watchStarted = await startWatchPosition();
      if (!watchStarted) {
        throw new Error("Nu s-a putut porni urmărirea poziției");
      }
      
      // Pornim timer-ul pentru trimiterea datelor
      if (gpsTimerRef.current) {
        clearInterval(gpsTimerRef.current);
      }
      
      // Trimitem date GPS la fiecare minut
      const GPS_INTERVAL = 60 * 1000; // 60 secunde
      gpsTimerRef.current = setInterval(async () => {
        try {
          // Obținem poziția curentă
          const position = await getCurrentPosition();
          
          // Trimitem poziția doar dacă transportul este activ
          if (transportStatusRef.current === "active") {
            // Trimitem poziția către server
            await sendGpsData(position);
          }
        } catch (error) {
          console.error("Eroare la obținerea poziției în timer:", error);
        }
      }, GPS_INTERVAL);
      
      // Activăm GPS-ul
      setIsGpsActive(true);
      
      return true;
    } catch (error) {
      console.error("Eroare la pornirea tracking-ului GPS:", error);
      return false;
    }
  }, [sendGpsData, startWatchPosition]);
  
  // Actualizăm UIT-urile disponibile când se schimbă vehiculul
  useEffect(() => {
    if (vehicleInfo && vehicleInfo.uit) {
      // Doar actualizăm UIT-urile disponibile fără a afecta starea transportului
      const newUit: UitOption = {
        uit: vehicleInfo.uit,
        start_locatie: vehicleInfo.start_locatie || "",
        stop_locatie: vehicleInfo.stop_locatie || ""
      };
      
      // Verificăm dacă UIT-ul nu există deja în listă
      const uitExists = selectedUits.some(uit => uit.uit === newUit.uit);
      
      if (!uitExists) {
        // Adăugăm noul UIT la lista de UIT-uri disponibile
        setSelectedUits(prev => [...prev, newUit]);
        console.log("UIT adăugat pentru vehiculul nou:", newUit);
      }
      
      // Când se schimbă vehiculul, setăm automat UIT-ul curent dacă nu există unul
      if (!currentActiveUit) {
        setCurrentActiveUit(newUit);
      }
    }
  }, [vehicleInfo?.nr, vehicleInfo?.uit, selectedUits, currentActiveUit]);
  
  // Inițializare GPS automată - acum folosește funcțiile definite mai sus
  useEffect(() => {
    // Funcție pentru inițializarea GPS-ului
    const initializeGps = async () => {
      try {
        // Inițializăm monitorizarea GPS la încărcarea componentei
        console.log("Inițializare GPS automată la pornire");
        
        // Solicităm permisiunile GPS
        const permissions = await CapacitorGeoService.requestPermissions();
        console.log("Permisiuni GPS obținute:", permissions);
        
        // Verificăm disponibilitatea GPS
        const available = await checkGpsAvailability();
        console.log("Disponibilitate GPS inițială:", available ? "Disponibil" : "Indisponibil");
        
        // Dacă GPS-ul este disponibil, obținem poziția inițială
        if (available) {
          try {
            const position = await getCurrentPosition();
            console.log("Poziție GPS inițială obținută:", {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            
            // Pornim urmărirea poziției pentru actualizări în timp real
            // Aceasta va actualiza UI-ul, dar nu va trimite date la server
            await startWatchPosition();
          } catch (error) {
            console.error("Eroare la obținerea poziției inițiale:", error);
          }
        }
      } catch (error) {
        console.error("Eroare la inițializarea automată GPS:", error);
      }
    };
    
    // Apelăm funcția de inițializare
    initializeGps();
    
    // Oprim tracking-ul GPS la distrugerea componentei
    return () => {
      console.log("Cleanup GPS la distrugerea contextului");
      stopGpsTracking();
    };
  }, [startWatchPosition, stopGpsTracking]);
  
  // Inițializare monitorizare conectivitate
  useEffect(() => {
    console.log("Inițializare monitorizare conectivitate");
    
    // Configurăm ascultătorii pentru conectivitate
    const cleanup = setupConnectivityListeners(
      // Callback pentru conectivitate restabilită
      async () => {
        // Sincronizăm datele offline dacă transportul este activ
        if (transportStatus === "active" && token) {
          await syncOfflineData(token);
        }
      }
    );
    
    // Curățăm ascultătorii la distrugerea componentei
    return () => {
      console.log("Cleanup monitorizare conectivitate");
      cleanup();
    };
  }, [transportStatus, token]);
  
  // Monitorizăm starea GPS și emitem mesaje de depanare
  useEffect(() => {
    console.log("DEPANARE GPS: ", {
      transportStatus,
      isGpsActive,
      hasCoordinates: !!gpsCoordinates,
      coordinates: gpsCoordinates
    });
    
    // Actualizăm starea indicată în UI
    const statusText = isGpsActive ? "ACTIV" : "INACTIV";
    console.log("Stare GPS actualizată:", statusText);
  }, [transportStatus, isGpsActive, gpsCoordinates]);
  
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
        description: "Lipsesc date esențiale. Vă rugăm să vă autentificați din nou.",
      });
      
      return false;
    }
    
    // Verificăm dacă avem un UIT selectat
    if (!currentActiveUit) {
      console.error("Niciun UIT selectat");
      
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Selectați un UIT pentru a începe transportul.",
      });
      
      return false;
    }
    
    try {
      // Verificăm disponibilitatea GPS
      const gpsAvailable = await checkGpsAvailability();
      if (!gpsAvailable) {
        console.error("GPS indisponibil");
        
        toast({
          variant: "destructive",
          title: "GPS indisponibil",
          description: "Activați GPS-ul pentru a începe un transport.",
        });
        
        return false;
      }
      
      // Schimbăm starea transportului 
      setTransportStatus("active");
      
      // Pornim tracking-ul GPS
      const trackingStarted = await startGpsTracking();
      if (!trackingStarted) {
        console.error("Nu s-a putut porni tracking-ul GPS");
        
        toast({
          variant: "destructive",
          title: "Eroare GPS",
          description: "Nu s-a putut activa urmărirea GPS.",
        });
        
        // Resetăm starea transportului
        setTransportStatus("inactive");
        return false;
      }
      
      // Pornim serviciul de background
      if (!isBackgroundActive) {
        const backgroundStarted = await startBackgroundLocationTracking(
          { 
            nr: vehicleInfo.nr, 
            uit: currentActiveUit.uit 
          },
          token
        );
        
        setIsBackgroundActive(backgroundStarted);
        console.log("Serviciu background pornit:", backgroundStarted ? "Succes" : "Eșuat");
      }
      
      // Notificare pentru utilizator
      toast({
        title: "Transport activ",
        description: `Transport ${currentActiveUit.uit} început.`,
      });
      
      console.log("Transport pornit cu succes pentru vehiculul", vehicleInfo.nr);
      
      // Resetăm flag-ul de notificare
      notificationSentRef.current = false;
      
      // Sincronizăm datele offline în caz că există
      if (token) {
        syncOfflineData(token);
      }
      
      // Emitem un mesaj vocal pentru a ne asigura că utilizatorul aude notificarea
      try {
        // Verificăm dacă notificările vocale sunt activate
        const voiceNotificationsEnabled = localStorage.getItem('voice_notifications_enabled');
        console.log("EMITERE CRITICĂ notificare vocală pentru pornire transport - Status:", 
                   voiceNotificationsEnabled === 'true' ? "ACTIVE" : "DEZACTIVATE");
        
        // Doar dacă notificările vocale sunt activate, emitem sunetele și mesajele
        if (voiceNotificationsEnabled === 'true') {
          // 1. Anulăm orice sinteză vocală în curs
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
          
          // 2. Creăm un element audio pentru a forța un sunet inițial
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
      
      // Dezactivăm explicit GPS-ul
      setIsGpsActive(false);
      
      // Notificare pentru utilizator
      toast({
        title: "Transport în pauză",
        description: "Transportul este în pauză. Apăsați Continuă pentru a relua.",
      });
    } catch (error) {
      console.error("Eroare la punerea în pauză a transportului:", error);
      
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut întrerupe temporar cursa.",
      });
    }
  };
  
  // Continuare transport
  const resumeTransport = async (): Promise<void> => {
    console.log("Continuare transport");
    
    try {
      // Verificăm disponibilitatea GPS
      const gpsAvailable = await checkGpsAvailability();
      if (!gpsAvailable) {
        console.error("GPS indisponibil, nu putem continua");
        
        toast({
          variant: "destructive",
          title: "GPS indisponibil",
          description: "Activați GPS-ul pentru a continua transportul.",
        });
        
        return;
      }
      
      // Schimbăm starea transportului
      setTransportStatus("active");
      
      // Pornim tracking-ul GPS
      const trackingStarted = await startGpsTracking();
      if (!trackingStarted) {
        console.error("Nu s-a putut porni tracking-ul GPS");
        
        toast({
          variant: "destructive",
          title: "Eroare GPS",
          description: "Nu s-a putut activa urmărirea GPS. Verificați permisiunile.",
        });
        
        // Resetăm starea transportului la pauză
        setTransportStatus("paused");
        return;
      }
      
      // Pornim serviciul de background
      if (!isBackgroundActive && vehicleInfo && currentActiveUit && token) {
        const backgroundStarted = await startBackgroundLocationTracking(
          { 
            nr: vehicleInfo.nr, 
            uit: currentActiveUit.uit 
          },
          token
        );
        
        setIsBackgroundActive(backgroundStarted);
        console.log("Serviciu background repornit:", backgroundStarted ? "Succes" : "Eșuat");
      }
      
      // Sincronizăm datele offline în caz că există
      if (token) {
        syncOfflineData(token);
      }
      
      // Notificare pentru utilizator
      toast({
        title: "Transport reluat",
        description: "Transportul a fost reluat. GPS activ.",
      });
    } catch (error) {
      console.error("Eroare la reluarea transportului:", error);
      
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut relua cursa. Încercați din nou.",
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
        console.log("Oprire serviciu background:", stopped ? "Succes" : "Eșuat");
        setIsBackgroundActive(false);
      }
      
      // Trimitem ultima poziție GPS cu status "finished"
      if (vehicleInfo && currentActiveUit && token) {
        try {
          const position = await getCurrentPosition();
          await sendGpsUpdate(
            position,
            { nr: vehicleInfo.nr, uit: currentActiveUit.uit },
            token,
            "finished"  // Marcăm explicit statusul ca finished
          );
          console.log("Ultima poziție GPS trimisă cu status 'finished'");
          
          // Eliminăm transportul din registrul
          removeTransport(vehicleInfo.nr);
          console.log(`Transport eliminat din registru: ${vehicleInfo.nr}`);
        } catch (error) {
          console.error("Eroare la trimiterea ultimei poziții GPS:", error);
        }
      }
      
      // Resetăm imediat starea transportului, fără întârziere
      console.log("Resetare completă stare transport");
      
      // Salvăm temporar informațiile vehiculului pentru reîncărcare
      const currentVehicleInfo = vehicleInfo;
      
      // Resetăm toate valorile la starea inițială
      setTransportStatus("inactive");
      setGpsCoordinates(null);
      setCurrentActiveUit(null);
      setLastGpsUpdateTime(null);
      setBattery(100);
      setIsGpsActive(false);
      
      // Reîncărcăm lista de transporturi disponibile
      try {
        // Notificare pentru utilizator
        toast({
          title: "Transport finalizat ✓",
          description: "Noile transporturi disponibile au fost încărcate.",
        });
        
        // Dacă vehicleInfo conține informațiile necesare, le folosim pentru a genera un nou UIT
        if (currentVehicleInfo) {
          console.log("Regenerare listă transporturi după finalizare:", currentVehicleInfo);
          
          // Recreăm opțiunea de transport
          const newUit: UitOption = {
            uit: currentVehicleInfo.uit,
            start_locatie: currentVehicleInfo.start_locatie || "",
            stop_locatie: currentVehicleInfo.stop_locatie || ""
          };
          
          // Adăugăm noul UIT în lista de transporturi disponibile
          setSelectedUits([newUit]);
          console.log("Transport regenerat și disponibil pentru selecție:", newUit);
        } else {
          // Resetăm lista de UIT-uri pentru a forța utilizatorul să selecteze din nou
          setSelectedUits([]);
        }
      } catch (error) {
        console.error("Eroare la reîncărcarea listei de transporturi:", error);
        setSelectedUits([]);
      }
    } catch (error) {
      console.error("Eroare la finalizarea transportului:", error);
      
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut finaliza cursa. Încercați din nou.",
      });
    }
  };
  
  // Implementăm funcțiile suplimentare pentru gestionarea transporturilor multiple
  const getTransportsInfo = useCallback(() => {
    return getAllTransports().map(t => ({
      vehicleNumber: t.vehicleNumber,
      status: t.status,
      uit: t.uit
    }));
  }, []);
  
  const checkHasActiveTransport = useCallback(() => {
    return vehicleInfo?.nr ? hasActiveTransport(vehicleInfo.nr) : false;
  }, [vehicleInfo?.nr]);
  
  const checkHasOtherActiveTransports = useCallback(() => {
    return vehicleInfo?.nr ? hasOtherActiveTransports(vehicleInfo.nr) : false;
  }, [vehicleInfo?.nr]);
  
  // Actualizăm registry când se schimbă starea transportului
  useEffect(() => {
    if (!vehicleInfo?.nr || !currentActiveUit) return;
    
    // Nu adăugăm în registry transporturi inactive sau finalizate
    if (transportStatus === 'inactive' || transportStatus === 'finished') {
      // Dacă transportul devine inactiv sau finalizat, îl eliminăm din registry
      removeTransport(vehicleInfo.nr);
      return;
    }
    
    // Actualizăm registrul pentru acest vehicul
    const currentTime = new Date().toISOString().replace('T', ' ').substr(0, 19);
    updateTransport({
      vehicleNumber: vehicleInfo.nr,
      uit: currentActiveUit.uit,
      status: transportStatus,
      startTime: currentTime,
      lastUpdateTime: currentTime
    });
    
  }, [transportStatus, vehicleInfo?.nr, currentActiveUit]);
  
  // Sincronizăm starea transportului cu registrul când se schimbă vehiculul
  useEffect(() => {
    if (!vehicleInfo?.nr) return;
    
    syncTransportWithRegistry(
      vehicleInfo.nr,
      transportStatus,
      currentActiveUit?.uit || '',
      (newStatus) => {
        console.log(`Starea transportului sincronizată din registru: ${newStatus}`);
        setTransportStatus(newStatus);
      }
    );
  }, [vehicleInfo?.nr]);
  
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
    hasOtherActiveTransports: checkHasOtherActiveTransports,
    hasActiveTransport: checkHasActiveTransport,
    getAllTransports: getTransportsInfo
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
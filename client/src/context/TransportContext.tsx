import { createContext, useContext, useState, ReactNode, useRef, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CapacitorGeoService } from "@/lib/capacitorService";
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

// Tipul contextului pentru transport
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
  isBackgroundActive: boolean;
}

// Creăm contextul
const TransportContext = createContext<TransportContextType | undefined>(undefined);

// Provider-ul pentru context
export function TransportProvider({ children }: { children: ReactNode }) {
  // State pentru transport
  const [transportStatus, setTransportStatus] = useState<TransportStatus>("inactive");
  // Referință pentru a urmări starea curentă a transportului în cadrul callback-urilor fără re-renderări
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
  
  // Accesăm autentificarea și toast
  const { token, vehicleInfo } = useAuth();
  const { toast } = useToast();
  
  // Actualizăm referința ori de câte ori se modifică statusul transportului
  useEffect(() => {
    transportStatusRef.current = transportStatus;
  }, [transportStatus]);
  
  // Referințe pentru timer și watcher
  const gpsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const watchPositionRef = useRef<{ clearWatch: () => void } | null>(null);
  
  // Flag pentru a preveni afișarea multiplă a notificărilor vocale
  const notificationSentRef = useRef<boolean>(false);
  
  // Activează GPS automat la pornirea aplicației
  useEffect(() => {
    // Încercăm să activăm GPS-ul imediat ce aplicația pornește
    const initializeGps = async () => {
      try {
        console.log("Inițializare GPS automată la pornire");
        // Solicităm permisiuni GPS
        const permissions = await CapacitorGeoService.requestPermissions();
        console.log("Permisiuni GPS obținute:", permissions);
        
        // Inițializăm GPS și stabilim poziția inițială
        const position = await CapacitorGeoService.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
        
        if (position && position.coords) {
          console.log("Poziție GPS inițială obținută:", {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          
          // Format timestamp
          const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
          
          // Coordonatele GPS sunt stocate întotdeauna pentru referință,
          // dar afișarea timpului ultimei actualizări și starea activă a GPS-ului
          // depind de starea transportului
          setGpsCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: timestamp,
            viteza: position.coords.speed ? position.coords.speed * 3.6 : 0,
            directie: position.coords.heading || 0,
            altitudine: position.coords.altitude || 0,
            baterie: battery
          });
          
          // Actualizăm timestamp-ul ultimei actualizări
          setLastGpsUpdateTime(timestamp);
          
          // GPS este activ dacă avem coordonate valide, indiferent de starea transportului
          // Asta permite să afișăm coordonatele în UI, dar acestea vor fi trimise la server
          // doar când transportul este activ
          setIsGpsActive(true);
          
          // Începem urmărirea poziției
          startWatchPosition();
        }
      } catch (error) {
        console.error("Eroare la inițializarea automată GPS:", error);
      }
    };
    
    // Executăm inițializarea
    initializeGps();
  }, []);
  
  // Inițializare monitorizare conectivitate la pornirea aplicației
  useEffect(() => {
    console.log("Inițializare monitorizare conectivitate");
    
    // Configurăm listener-ul pentru conectivitate și obținem funcția de cleanup
    const cleanupListener = setupConnectivityListeners((isConnected) => {
      console.log("Stare conectivitate schimbată:", isConnected ? "Online" : "Offline");
      
      // Dacă suntem online și avem un transport activ, sincronizăm datele
      if (isConnected && transportStatus === "active") {
        syncOfflineData(token || undefined).then((success) => {
          console.log("Rezultat sincronizare date offline:", success ? "Succes" : "Parțial");
        });
      }
    });
    
    // Verificăm disponibilitatea GPS-ului și actualizăm starea
    checkGpsAvailability().then(isAvailable => {
      console.log("Disponibilitate GPS inițială:", isAvailable ? "Disponibil" : "Indisponibil");
      
      // Actualizarea stării GPS depinde de mai mulți factori
      // GPS este considerat activ dacă:
      // 1. Hardware-ul GPS este disponibil ȘI
      // 2. Avem coordonate GPS valide
      const gpsIsReallyActive = isAvailable && !!gpsCoordinates;
      
      // Actualizăm starea dacă este diferită
      if (gpsIsReallyActive !== isGpsActive) {
        setIsGpsActive(gpsIsReallyActive);
        console.log("Stare GPS actualizată:", gpsIsReallyActive ? "ACTIV" : "INACTIV");
      }
    });
    
    // Cleanup la demontarea componentei
    return () => {
      console.log("Cleanup monitorizare conectivitate");
      
      // Oprim timer-ul GPS dacă există
      if (gpsTimerRef.current) {
        clearInterval(gpsTimerRef.current);
        gpsTimerRef.current = null;
      }
      
      // Oprim watch position dacă există
      if (watchPositionRef.current) {
        watchPositionRef.current.clearWatch();
        watchPositionRef.current = null;
      }
      
      // Curățăm listener-ul de conectivitate dacă există
      if (cleanupListener && typeof cleanupListener === 'function') {
        cleanupListener();
      }
    };
  }, [token, transportStatus]);
  
  // Obținere poziție GPS curentă
  const getCurrentPosition = useCallback(async () => {
    console.log("Obținere poziție curentă");
    
    try {
      // Solicităm permisiuni pentru geolocație
      const permissionResult = await CapacitorGeoService.requestPermissions();
      console.log("Rezultat permisiuni geolocation:", permissionResult);
      
      // Obținem poziția curentă
      const position = await CapacitorGeoService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });
      
      // Verificăm dacă poziția este validă
      if (!position || !position.coords) {
        throw new Error("Poziție GPS invalidă sau incompletă");
      }
      
      console.log("Poziție obținută:", JSON.stringify({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        alt: position.coords.altitude,
        speed: position.coords.speed,
        heading: position.coords.heading
      }));
      return position;
    } catch (error) {
      console.error("Eroare la obținerea poziției:", error);
      throw error;
    }
  }, []);
  
  // Trimitere date GPS către server
  const sendGpsData = useCallback(async (status: "in_progress" | "finished" = "in_progress") => {
    console.log("Trimitere date GPS - status:", status);
    
    // Verificăm datele necesare
    if (!token || !vehicleInfo) {
      console.error("Lipsesc date necesare pentru trimiterea coordonatelor GPS (token/vehicleInfo):");
      console.log("token:", token ? "Există" : "Lipsește");
      console.log("vehicleInfo:", vehicleInfo);
      return false;
    }
    
    // IMPORTANT: Verificăm și setăm UIT-ul dacă este necesar
    let uitToUse: UitOption | null = currentActiveUit;
    
    // Dacă nu avem UIT activ, încercăm să folosim informațiile disponibile
    if (!uitToUse) {
      // Prima sursă: UIT-urile selectate
      if (selectedUits.length > 0) {
        uitToUse = selectedUits[0];
        console.log("Folosim primul UIT selectat:", uitToUse);
        // Actualizăm UIT-ul curent activ pentru viitoare cereri
        setCurrentActiveUit(uitToUse);
      }
      // A doua sursă: Informațiile vehiculului
      else if (vehicleInfo && vehicleInfo.uit) {
        uitToUse = {
          uit: vehicleInfo.uit,
          start_locatie: vehicleInfo.start_locatie || "",
          stop_locatie: vehicleInfo.stop_locatie || ""
        };
        console.log("Folosim UIT din informațiile vehiculului:", uitToUse);
        // Actualizăm UIT-ul curent activ pentru viitoare cereri
        setCurrentActiveUit(uitToUse);
      }
      // Dacă tot nu avem un UIT, încercăm să folosim un UIT generic
      else {
        uitToUse = {
          uit: "UIT12345", // UIT generic pentru situații de urgență
          start_locatie: "Origine",
          stop_locatie: "Destinație"
        };
        console.log("Folosim UIT generic de urgență:", uitToUse);
        // Actualizăm UIT-ul curent activ pentru viitoare cereri
        setCurrentActiveUit(uitToUse);
      }
    }
    
    try {
      // Obținem poziția curentă
      const position = await getCurrentPosition();
      
      // Actualizăm nivelul bateriei (simulare)
      const newBattery = Math.max(1, battery - 0.5);
      setBattery(newBattery);
      
      // Formatăm timestamp-ul
      const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
      
      // Extragem coordonatele
      const { latitude, longitude, altitude, speed, heading } = position.coords;
      const speedKmh = speed ? speed * 3.6 : 0;
      
      // Setăm date GPS în state pentru afișare în UI
      const gpsData: GpsCoordinates = {
        lat: latitude,
        lng: longitude,
        timestamp,
        viteza: speedKmh,
        directie: heading || 0,
        altitudine: altitude || 0,
        baterie: Math.round(newBattery)
      };
      
      // Verificăm UIT-ul încă o dată
      if (!uitToUse) {
        console.error("UIT-ul necesar este în continuare nedefinit. Folosim UIT-ul din vehicleInfo");
        uitToUse = {
          uit: vehicleInfo.uit || "UIT12345",
          start_locatie: vehicleInfo.start_locatie || "",
          stop_locatie: vehicleInfo.stop_locatie || ""
        };
      }
      
      setGpsCoordinates(gpsData);
      setLastGpsUpdateTime(timestamp);
      // Considerăm GPS-ul activ dacă avem coordonate valide, indiferent de starea transportului
      setIsGpsActive(true);
      
      // Ne asigurăm că avem un UIT activ
      if (!currentActiveUit && selectedUits.length > 0) {
        setCurrentActiveUit(selectedUits[0]);
      }
      
      // Trimitem datele către server
      const success = await sendGpsUpdate(
        position,
        {
          nr: vehicleInfo.nr,
          uit: currentActiveUit?.uit || vehicleInfo.uit // Folosim UIT-ul activ sau cel din vehicleInfo
        },
        token,
        status
      );
      
      return success;
    } catch (error) {
      console.error("Eroare la trimiterea datelor GPS:", error);
      return false;
    }
  }, [getCurrentPosition, token, vehicleInfo, currentActiveUit, battery]);
  
  // Inițiere tracking GPS
  const startGpsTracking = useCallback(async () => {
    console.log("Start tracking GPS");
    
    // Oprim tracker-ul existent dacă există
    if (gpsTimerRef.current) {
      clearInterval(gpsTimerRef.current);
      gpsTimerRef.current = null;
    }
    
    // Marcăm GPS-ul ca activ
    setIsGpsActive(true);
    
    try {
      // IMPORTANT: Verificăm și setăm UIT-ul înainte de a trimite date GPS
      if (!currentActiveUit && vehicleInfo) {
        // Creăm un UIT din vehicleInfo dacă nu avem deja unul
        const newUit = {
          uit: vehicleInfo.uit,
          start_locatie: vehicleInfo.start_locatie,
          stop_locatie: vehicleInfo.stop_locatie
        };
        console.log("Setăm UIT-ul din vehicleInfo înainte de a trimite coordonate:", newUit);
        setCurrentActiveUit(newUit);
      }
      
      // Trimitem prima dată coordonatele cu status "in_progress"
      console.log("Trimitem prima dată coordonatele cu vehicleInfo:", vehicleInfo);
      const success = await sendGpsData("in_progress");
      console.log("Trimitere inițială coordonate GPS (in_progress):", success ? "Succes" : "Eșuată");
      
      // Configurăm trimiterea periodică a coordonatelor în prim-plan la interval de 1 minut
      // În producție este 60000 ms (1 minut), în dezvoltare 10000 ms (10 secunde)
      const updateInterval = import.meta.env.PROD ? 60000 : 10000;
      console.log(`Setăm timer trimitere periodică la ${updateInterval/1000} secunde`);
      
      gpsTimerRef.current = setInterval(async () => {
        // IMPORTANT: Verificăm cu strictețe că transportul este ACTIV
        // Nu trimitem coordonate dacă transportul este în pauză sau finalizat
        const currentTransportStatus = transportStatusRef.current;
        
        if (currentTransportStatus === "active") {
          console.log("Timer declanșat - Transport ACTIV - Se trimit coordonate GPS");
          const sendSuccess = await sendGpsData("in_progress");
          console.log("Trimitere periodică coordonate GPS (in_progress):", sendSuccess ? "Succes" : "Eșuată");
        } else {
          console.log("Timer declanșat - Transport NU este activ (status: " + currentTransportStatus + ") - NU se trimit coordonate GPS");
          
          // Ștergem timer-ul dacă transportul nu mai este activ pentru a evita trimiteri nedorite
          if (gpsTimerRef.current && (currentTransportStatus === "paused" || currentTransportStatus === "finished" || currentTransportStatus === "inactive")) {
            console.log("Oprire timer GPS - transport inactiv/pauză/finalizat");
            clearInterval(gpsTimerRef.current);
            gpsTimerRef.current = null;
          }
        }
      }, updateInterval);
      
      // Începem urmărirea poziției pentru actualizări UI în timp real
      await startWatchPosition();
      
      return true;
    } catch (error) {
      console.error("Eroare la pornirea tracking-ului GPS:", error);
      return false;
    }
  }, [sendGpsData]);
  
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
        // Aceasta este o schimbare majoră conform cerinței: GPS nu trebuie să apară activ
        // până când nu se dă start la o cursă sau se reia o cursă
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
  }, [battery]);
  
  // Oprire tracking GPS
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
  
  // Pornire transport
  const startTransport = async () => {
    console.log("Pornire transport - Verificare condiții");
    
    // Verificăm dacă avem toate datele necesare
    if (!vehicleInfo || !token) {
      console.error("Date lipsă pentru pornirea transportului:");
      console.log("vehicleInfo:", vehicleInfo);
      console.log("token:", token ? "Există" : "Lipsește");
      console.log("currentActiveUit:", currentActiveUit);
      
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut porni cursa. Lipsesc date despre vehicul.",
      });
      return;
    }
    
    // Dacă nu avem UIT activ, creăm unul din informațiile vehiculului
    if (!currentActiveUit) {
      console.log("Nu există UIT activ, creăm unul din vehicleInfo");
      
      if (vehicleInfo.uit) {
        // Creăm un UIT bazat pe informațiile vehiculului
        const newUit: UitOption = {
          uit: vehicleInfo.uit,
          start_locatie: vehicleInfo.start_locatie || "",
          stop_locatie: vehicleInfo.stop_locatie || ""
        };
        
        // Adăugăm UIT-ul în lista de selectate
        const newSelectedUits = [...selectedUits, newUit];
        setSelectedUits(newSelectedUits);
        
        // Setăm UIT-ul ca activ
        setCurrentActiveUit(newUit);
        console.log("Am creat și setat UIT activ din vehicleInfo:", newUit);
      } else {
        toast({
          variant: "destructive",
          title: "Eroare",
          description: "Nu s-a putut porni cursa. Lipsesc date UIT.",
        });
        return;
      }
    }
    
    try {
      console.log("Pornire transport - Inițiere GPS și setare status");
      
      // Reset flag pentru notificări
      notificationSentRef.current = false;
      
      // Pornim tracking-ul GPS - IMPORTANT: facem asta ÎNAINTE de a schimba starea transportului
      const gpsStarted = await startGpsTracking();
      console.log("Tracking GPS pornit:", gpsStarted ? "Succes" : "Eșuat");
      
      if (!gpsStarted) {
        throw new Error("Nu s-a putut iniția tracking-ul GPS");
      }
      
      // Dacă tracking-ul GPS a pornit cu succes, schimbăm starea transportului
      setTransportStatus("active");
      
      // Pornim serviciul de background pentru tracking continuu
      const backgroundStarted = await startBackgroundLocationTracking(
        { nr: vehicleInfo.nr, uit: currentActiveUit?.uit || vehicleInfo.uit },
        token
      );
      console.log("Serviciu background pornit:", backgroundStarted ? "Succes" : "Eșuat");
      setIsBackgroundActive(backgroundStarted);
      
      // Anunțăm utilizatorul că transportul a început
      toast({
        title: "Transport pornit",
        description: `Cursa a început. Coordonatele GPS se trimit acum${backgroundStarted ? ' și în background' : ''}.`,
      });
      
      // Emitem un mesaj vocal forțat pentru a ne asigura că utilizatorul aude notificarea
      // Folosim o abordare alternativă pentru pornirea transportului
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
    }
  };
  
  // Pauză transport
  const pauseTransport = async () => {
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
      
      // Anunțăm utilizatorul
      toast({
        title: "Transport în pauză",
        description: "Transmisia coordonatelor GPS este întreruptă temporar.",
      });
      
      // Emitem un mesaj vocal doar dacă sunt activate
      if (window.speechSynthesis) {
        // Verificăm dacă notificările vocale sunt activate
        const voiceNotificationsEnabled = localStorage.getItem('voice_notifications_enabled');
        if (voiceNotificationsEnabled === 'true') {
          const utterance = new SpeechSynthesisUtterance("Transport pus în pauză.");
          utterance.lang = 'ro-RO';
          utterance.volume = 1.0;
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
          console.log("Notificare vocală pauză emisă");
        }
      }
    } catch (error) {
      console.error("Eroare la întreruperea transportului:", error);
      
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut întrerupe cursa. Încercați din nou.",
      });
    }
  };
  
  // Reluare transport
  const resumeTransport = async () => {
    console.log("Reluare transport - Verificare condiții");
    
    // Verificăm dacă avem toate datele necesare
    if (!vehicleInfo || !token || !currentActiveUit) {
      console.error("Date lipsă pentru reluarea transportului");
      
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut relua cursa. Lipsesc date vehicul sau UIT.",
      });
      return;
    }
    
    try {
      console.log("Reluare transport - Repornire GPS și serviciu background");
      
      // Pornim tracking-ul GPS
      const gpsStarted = await startGpsTracking();
      console.log("Tracking GPS repornit:", gpsStarted ? "Succes" : "Eșuat");
      
      // Schimbăm starea transportului
      setTransportStatus("active");
      
      // Repornim serviciul de background
      const backgroundStarted = await startBackgroundLocationTracking(
        { nr: vehicleInfo.nr, uit: currentActiveUit.uit },
        token
      );
      console.log("Serviciu background repornit:", backgroundStarted ? "Succes" : "Eșuat");
      setIsBackgroundActive(backgroundStarted);
      
      // Anunțăm utilizatorul
      toast({
        title: "Transport reluat",
        description: "Transmisia coordonatelor GPS a fost reluată.",
      });
      
      // Emitem un mesaj vocal doar dacă sunt activate
      if (window.speechSynthesis) {
        // Verificăm dacă notificările vocale sunt activate
        const voiceNotificationsEnabled = localStorage.getItem('voice_notifications_enabled');
        if (voiceNotificationsEnabled === 'true') {
          const utterance = new SpeechSynthesisUtterance("Transport reluat. Deplasare în curs.");
          utterance.lang = 'ro-RO';
          utterance.volume = 1.0;
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
          console.log("Notificare vocală reluare emisă");
        }
      }
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
  const finishTransport = async () => {
    console.log("Finalizare transport");
    
    try {
      // Trimitem ultima poziție cu statusul "finished"
      if (isGpsActive && currentActiveUit) {
        try {
          console.log("Trimitere ultimă poziție cu status 'finished'");
          await sendGpsData("finished");
        } catch (error) {
          console.error("Eroare la trimiterea ultimei poziții:", error);
        }
      }
      
      // Oprim tracking-ul GPS
      stopGpsTracking();
      
      // Oprim serviciul de background
      if (isBackgroundActive) {
        const stopped = stopBackgroundLocationTracking();
        console.log("Oprire serviciu background:", stopped ? "Succes" : "Eșuat");
        setIsBackgroundActive(false);
      }
      
      // Schimbăm starea transportului
      setTransportStatus("finished");
      
      // Anunțăm utilizatorul
      toast({
        title: "Transport finalizat",
        description: "Cursa a fost finalizată cu succes.",
      });
      
      // Emitem un mesaj vocal pentru finalizare transport + trimitem ultima poziție cu status "finished"
      if (window.speechSynthesis) {
        // Verificăm dacă notificările vocale sunt activate
        const voiceNotificationsEnabled = localStorage.getItem('voice_notifications_enabled');
        if (voiceNotificationsEnabled === 'true') {
          // Anulăm orice alt mesaj în curs
          window.speechSynthesis.cancel();
          
          // Creem mesajul cu parametri optimi pentru a fi auzit
          const utterance = new SpeechSynthesisUtterance("Transport finalizat cu succes.");
          utterance.lang = 'ro-RO';
          utterance.volume = 1.0;
          utterance.rate = 0.9;
          
          // Pronunțăm mesajul cu o mică întârziere
          setTimeout(() => {
            window.speechSynthesis.speak(utterance);
            console.log("EMITERE VOCALĂ: Transport finalizat");
          }, 300);
        }
      }
      
      // Trimitem ultima poziție GPS cu status "finished" pentru a marca finalizarea transportului în sistem
      if (gpsCoordinates && vehicleInfo && token && currentActiveUit) {
        try {
          // Obținem poziția curentă pentru a o trimite ca punct final
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
    isBackgroundActive
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
}
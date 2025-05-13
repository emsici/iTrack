import { useEffect, useRef, useState } from 'react';
import { useTransport } from '@/context/TransportContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type VoiceNotification = {
  id: string;
  message: string;
  timestamp: Date;
  played: boolean;
};

export default function VoiceNotifications() {
  const { transportStatus, isGpsActive, lastGpsUpdateTime, isBackgroundActive, gpsCoordinates } = useTransport();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(true);
  const [notifications, setNotifications] = useState<VoiceNotification[]>([]);
  
  // Referință pentru instanța SpeechSynthesis
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  
  // Stare anterioară pentru a detecta schimbările
  const prevStatusRef = useRef(transportStatus);
  const prevGpsActiveRef = useRef(isGpsActive);
  const lastNotificationTimeRef = useRef<number>(0);
  
  // Inițializare SpeechSynthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthRef.current = window.speechSynthesis;
    }
    
    // Cleanup
    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);
  
  // Monitorizează schimbările de stare și generează notificări
  useEffect(() => {
    if (!enabled) return;
    
    const currentTime = Date.now();
    // Limitează notificările la cel mult o dată la 5 secunde pentru a evita spam-ul
    const timeSinceLastNotification = currentTime - lastNotificationTimeRef.current;
    if (timeSinceLastNotification < 5000) return;
    
    let newNotification: VoiceNotification | null = null;
    
    // Verifică schimbări în starea transportului
    if (transportStatus !== prevStatusRef.current) {
      console.log(`Stare transport schimbată: ${prevStatusRef.current} -> ${transportStatus}`);
      
      switch (transportStatus) {
        case 'active':
          newNotification = {
            id: `transport_${Date.now()}`,
            message: 'Transport început. Deplasare în curs.',
            timestamp: new Date(),
            played: false
          };
          break;
        case 'paused':
          newNotification = {
            id: `transport_${Date.now()}`,
            message: 'Transport pus în pauză.',
            timestamp: new Date(),
            played: false
          };
          break;
        case 'finished':
          newNotification = {
            id: `transport_${Date.now()}`,
            message: 'Transport finalizat cu succes.',
            timestamp: new Date(),
            played: false
          };
          break;
      }
      
      prevStatusRef.current = transportStatus;
      
      // Forțăm actualizarea notificării pentru schimbări de stare
      if (newNotification) {
        setNotifications(prev => [...prev, newNotification!]);
        lastNotificationTimeRef.current = currentTime;
        
        // Anunță imediat notificarea
        if (speechSynthRef.current && newNotification.message) {
          const utterance = new SpeechSynthesisUtterance(newNotification.message);
          utterance.lang = 'ro-RO';
          utterance.volume = 1;
          utterance.rate = 1;
          
          speechSynthRef.current.speak(utterance);
          
          toast({
            title: "Notificare vocală",
            description: newNotification.message,
          });
        }
        
        return;
      }
    }
    
    // Verifică schimbări în starea GPS-ului
    if (isGpsActive !== prevGpsActiveRef.current) {
      if (!isGpsActive) {
        newNotification = {
          id: `gps_${Date.now()}`,
          message: 'Atenție! Semnal GPS pierdut. Verificați accesul la locație.',
          timestamp: new Date(),
          played: false
        };
      } else {
        newNotification = {
          id: `gps_${Date.now()}`,
          message: 'Semnal GPS restabilit.',
          timestamp: new Date(),
          played: false
        };
      }
      prevGpsActiveRef.current = isGpsActive;
    }
    
    // Adaugă notificarea nouă dacă există
    if (newNotification) {
      setNotifications(prev => [...prev, newNotification!]);
      lastNotificationTimeRef.current = currentTime;
    }
  }, [transportStatus, isGpsActive, enabled]);
  
  // Verifică și avertizează schimbările semnificative de viteză (>20 km/h)
  useEffect(() => {
    if (!enabled || !gpsCoordinates || transportStatus !== "active") return;
    
    const currentTime = Date.now();
    if (currentTime - lastNotificationTimeRef.current < 30000) return; // Minim 30 secunde între notificări de viteză
    
    // Verificăm dacă viteza a depășit 90 km/h - doar ca exemplu
    if (gpsCoordinates.viteza > 90) {
      const newNotification = {
        id: `speed_${Date.now()}`,
        message: `Atenție! Viteza actuală este de ${Math.round(gpsCoordinates.viteza)} kilometri pe oră.`,
        timestamp: new Date(),
        played: false
      };
      
      setNotifications(prev => [...prev, newNotification]);
      lastNotificationTimeRef.current = currentTime;
    }
  }, [gpsCoordinates, enabled, transportStatus]);
  
  // Procesează notificările și le anunță vocal
  useEffect(() => {
    if (!enabled || !speechSynthRef.current) return;
    
    // Verifică dacă avem vreo notificare neafișată
    const unplayedNotification = notifications.find(n => !n.played);
    if (!unplayedNotification) return;
    
    console.log("Procesare notificare vocală:", unplayedNotification.message);
    
    // Creează un nou obiect utterance
    const utterance = new SpeechSynthesisUtterance(unplayedNotification.message);
    
    // Setează limba la română
    utterance.lang = 'ro-RO';
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;
    
    // Marchează notificarea ca anunțată pentru a nu o mai repeta
    const updatedNotifications = notifications.map(n => 
      n.id === unplayedNotification.id ? { ...n, played: true } : n
    );
    setNotifications(updatedNotifications);
    
    // Anunță vocal mesajul
    try {
      // Fix pentru Firefox și unele browsere care nu anunță corect
      if (speechSynthRef.current.speaking) {
        speechSynthRef.current.cancel();
      }
      
      // Arată toast pentru notificare
      toast({
        title: "Notificare vocală",
        description: unplayedNotification.message,
      });
      
      // Anunță vocal mesajul cu o întârziere mai mare pentru a permite browser-ului să se pregătească
      setTimeout(() => {
        if (speechSynthRef.current) {
          // Verificăm din nou dacă poate fi încă în curs o pronunțare
          if (speechSynthRef.current.speaking) {
            speechSynthRef.current.cancel();
          }
          
          // Adăugăm eveniment pentru a detecta când mesajul s-a terminat
          utterance.onend = () => {
            console.log("Mesaj vocal finalizat cu succes:", unplayedNotification.message);
          };
          
          // Încearcă să pronunțe cu volum maxim și rată ușor mai lentă pentru claritate
          utterance.volume = 1.0;
          utterance.rate = 0.9;
          
          // Emitem mesajul
          speechSynthRef.current.speak(utterance);
          console.log("FORȚARE emitere notificare vocală:", unplayedNotification.message);
          
          // Adăugăm și un sunet de alertă discret pentru notificările importante
          if (unplayedNotification.message.includes("Transport") || 
              unplayedNotification.message.includes("Atenție") ||
              unplayedNotification.message.includes("GPS")) {
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
              
              const gainNode = audioContext.createGain();
              gainNode.gain.setValueAtTime(0.2, audioContext.currentTime); // Volume reduced
              
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              
              // Redăm un sunet scurt de alertă
              oscillator.start();
              setTimeout(() => {
                oscillator.stop();
              }, 200);
            } catch (audioError) {
              console.error("Nu s-a putut genera sunetul de alertă:", audioError);
            }
          }
        }
      }, 300);
    } catch (error) {
      console.error("Eroare la emiterea notificării vocale:", error);
    }
  }, [notifications, enabled, toast]);
  
  // Curăță notificările vechi (păstrează doar ultimele 10)
  useEffect(() => {
    if (notifications.length > 10) {
      setNotifications(prev => prev.slice(-10));
    }
  }, [notifications]);
  
  // Toggle pentru activare/dezactivare
  const toggleEnabled = () => {
    setEnabled(prev => !prev);
    
    // Arată un toast pentru a confirma acțiunea
    toast({
      title: enabled ? "Notificări vocale dezactivate" : "Notificări vocale activate",
      description: enabled 
        ? "Nu veți mai primi anunțuri vocale." 
        : "Veți primi anunțuri vocale pentru schimbările importante."
    });
    
    // Dacă dezactivăm, oprim orice anunț în curs
    if (enabled && speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
  };
  
  return (
    <div className="p-4 rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium flex items-center">
          {enabled ? <Volume2 className="h-5 w-5 mr-2 text-blue-500" /> : <VolumeX className="h-5 w-5 mr-2 text-gray-500" />}
          Notificări vocale
        </h3>
        <div className="flex items-center space-x-2">
          <Switch id="voice-mode" checked={enabled} onCheckedChange={toggleEnabled} />
          <Label htmlFor="voice-mode">{enabled ? 'Activate' : 'Dezactivate'}</Label>
        </div>
      </div>
      
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          {enabled 
            ? "Veți primi anunțuri vocale pentru schimbări importante în timpul transportului." 
            : "Notificările vocale sunt dezactivate."}
        </p>
        
        {enabled && (
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Schimbări în starea transportului</p>
            <p>• Pierdere sau redobândire a semnalului GPS</p>
            <p>• Alerte de viteză excesivă</p>
          </div>
        )}
        
        {notifications.length > 0 && enabled && (
          <div className="mt-3">
            <h4 className="text-sm font-medium mb-2">Ultimele notificări:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {notifications
                .slice()
                .reverse()
                .map((notification) => (
                  <div 
                    key={notification.id} 
                    className="text-xs p-2 rounded bg-gray-50 flex justify-between items-center"
                  >
                    <span>{notification.message}</span>
                    <span className="text-gray-400">
                      {notification.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
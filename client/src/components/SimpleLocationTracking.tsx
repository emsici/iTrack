import { useTransport } from "@/context/TransportContext";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Gauge, Navigation, Battery, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function SimpleLocationTracking() {
  const { gpsCoordinates, isGpsActive, lastGpsUpdateTime, isBackgroundActive, battery, transportStatus } = useTransport();
  const [isConnected, setIsConnected] = useState(true);
  const [deviceBattery, setDeviceBattery] = useState<number | null>(null);
  const [localCoordinates, setLocalCoordinates] = useState<any>(null);
  const [gpsErrorCount, setGpsErrorCount] = useState(0);
  const [lastGpsErrorTime, setLastGpsErrorTime] = useState<Date | null>(null);
  
  // Obținem coordonatele direct și le propagăm în context
  const { setGpsCoordinates, setLastGpsUpdateTime } = useTransport();
  
  // Debug pentru starea GPS
  useEffect(() => {
    console.log("DEPANARE GPS (LocationTracking): ", {
      transportStatus,
      isGpsActive,
      hasCoordinates: !!gpsCoordinates,
      battery,
      deviceBattery,
      lastUpdateTime: lastGpsUpdateTime,
      coords: gpsCoordinates,
      localCoords: localCoordinates,
      gpsErrorCount
    });
  }, [transportStatus, isGpsActive, gpsCoordinates, battery, deviceBattery, lastGpsUpdateTime, localCoordinates, gpsErrorCount]);
  
  // Actualizăm erorile GPS când sunt detectate
  useEffect(() => {
    // Creăm un handler pentru erorile de geolocație
    const handleGpsError = () => {
      setGpsErrorCount(prev => prev + 1);
      setLastGpsErrorTime(new Date());
    };
    
    // Adăugăm un listener global pentru evenimentele personalizate
    window.addEventListener('gps-timeout-error', handleGpsError);
    
    return () => {
      window.removeEventListener('gps-timeout-error', handleGpsError);
    };
  }, []);
  
  // Resetăm contorul de erori după un interval
  useEffect(() => {
    const resetTimer = setInterval(() => {
      // Dacă au trecut mai mult de 30 secunde de la ultima eroare, resetăm contorul
      if (lastGpsErrorTime && (new Date().getTime() - lastGpsErrorTime.getTime()) > 30000) {
        setGpsErrorCount(0);
      }
    }, 10000);
    
    return () => clearInterval(resetTimer);
  }, [lastGpsErrorTime]);
  
  // Stocăm ultimele coordonate valide pentru a le folosi ca fallback
  const [lastValidCoordinates, setLastValidCoordinates] = useState<any>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  
  // Efect pentru obținerea coordonatelor
  useEffect(() => {
    // Creăm o funcție pentru obținerea coordonatelor
    const getCurrentLocation = () => {
      if (navigator && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: new Date().toISOString(),
              viteza: position.coords.speed || 0,
              directie: position.coords.heading || 0,
              altitudine: position.coords.altitude || 0,
              baterie: 100
            };
            setLocalCoordinates(coords);
            
            // Actualizăm și în contextul global pentru a fi disponibile în alte componente
            setGpsCoordinates(coords);
            
            // Actualizăm și ultimul timp de actualizare
            setLastGpsUpdateTime(new Date().toISOString());
            
            // Salvăm ultimele coordonate valide
            setLastValidCoordinates(coords);
            
            console.log("Coordonate obținute direct și actualizate în context:", coords);
            
            // Resetăm contorul de erori când obținem coordonate cu succes
            if (gpsErrorCount > 0) {
              setGpsErrorCount(0);
              setRetryAttempt(0); // resetăm și numărul de încercări
            }
          },
          (error) => {
            // Nu afișăm erori GPS când transportul este activ și avem coordonate valide
            if (transportStatus !== 'active' || !lastValidCoordinates) {
              console.error("Eroare obținere coordonate:", error);
            } else {
              // Pentru transport activ, doar log discret
              console.log("GPS temporar indisponibil (normal pentru dispozitive mobile)");
            }
            
            // Incrementăm contorul de erori și actualizăm timpul
            setGpsErrorCount(prev => prev + 1);
            setLastGpsErrorTime(new Date());
            
            // Incrementăm numărul de încercări pentru exponential backoff
            setRetryAttempt(prev => prev + 1);
            
            // Emitem un eveniment de eroare GPS pentru a putea reacționa în alte componente
            const errorEvent = new CustomEvent('gps-timeout-error', { 
              detail: { error, timestamp: new Date() } 
            });
            window.dispatchEvent(errorEvent);
            
            // Dacă avem timeout sau altă eroare, încercăm din nou cu o strategie de backoff exponențial
            if (error.code === 3 || error.code === 2) { // TIMEOUT sau POSITION_UNAVAILABLE
              // Calculăm timpul de așteptare cu backoff exponențial (max 10 secunde)
              const backoffTime = Math.min(500 * Math.pow(1.5, retryAttempt), 10000);
              const timeoutValue = Math.min(5000 * Math.pow(1.2, retryAttempt), 20000);
              
              console.log(`Timeout GPS, reîncercăm în ${backoffTime}ms cu timeout ${timeoutValue}ms (încercarea ${retryAttempt})`);
              
              // Folosim coordonatele anterioare dacă există, pentru a menține un nivel de continuitate
              if (lastValidCoordinates && transportStatus === 'active') {
                const updatedCoords = {
                  ...lastValidCoordinates,
                  timestamp: new Date().toISOString(),
                  // Adăugăm un marker că acestea sunt coordonate estimative
                  isEstimated: true
                };
                
                console.log("Folosim coordonate anterioare în timpul problemelor GPS:", updatedCoords);
                
                // Nu actualizăm direct UI-ul, dar putem folosi aceste coordonate pentru a menține transportul activ
                if (gpsErrorCount > 5) {
                  setGpsCoordinates(updatedCoords);
                  setLastGpsUpdateTime(new Date().toISOString());
                }
              }
              
              // Reîncercăm cu un timeout mai mare după perioada de backoff
              setTimeout(() => {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    // Procesăm poziția la fel ca mai sus
                    const coords = {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                      timestamp: new Date().toISOString(),
                      viteza: position.coords.speed || 0,
                      directie: position.coords.heading || 0,
                      altitudine: position.coords.altitude || 0,
                      baterie: 100
                    };
                    setLocalCoordinates(coords);
                    setGpsCoordinates(coords);
                    setLastGpsUpdateTime(new Date().toISOString());
                    setLastValidCoordinates(coords);
                    console.log("Coordonate obținute după reîncercare:", coords);
                    
                    // Resetăm contorul de erori și încercări
                    setGpsErrorCount(0);
                    setRetryAttempt(0);
                  },
                  (retryError) => {
                    console.error("Eroare la reîncercarea obținerii coordonatelor:", retryError);
                  },
                  // Folosim timeout-ul calculat pentru reîncercare
                  { enableHighAccuracy: true, timeout: timeoutValue, maximumAge: 1000 }
                );
              }, backoffTime);
            }
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    };
    
    // Apelăm imediat pentru a obține coordonatele inițiale
    getCurrentLocation();
    
    // Setăm un interval pentru actualizări periodice
    // Mărim intervalul la 3 secunde pentru a reduce presiunea pe baterie și pentru a da mai mult timp GPS-ului
    const timer = setInterval(getCurrentLocation, 3000);
    
    return () => clearInterval(timer);
  }, [setGpsCoordinates, setLastGpsUpdateTime, gpsErrorCount, retryAttempt, lastValidCoordinates, transportStatus]);
  
  // Verificăm periodic conexiunea la internet
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(navigator.onLine);
    };
    
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    checkConnection();
    
    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);
  
  // Obținem nivelul bateriei
  useEffect(() => {
    // Funcție pentru a obține nivelul bateriei
    const getBattery = async () => {
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setDeviceBattery(Math.round(battery.level * 100));
          
          // Actualizăm când se schimbă nivelul bateriei
          battery.addEventListener('levelchange', () => {
            setDeviceBattery(Math.round(battery.level * 100));
          });
        } catch (e) {
          console.error("Nu s-a putut obține nivelul bateriei:", e);
        }
      }
    };
    
    // Inițializăm o singură dată
    getBattery();
  }, []);
    
  const formatTime = (timeString: string | null) => {
    if (!timeString) return "N/A";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString();
    } catch (e) {
      return "N/A";
    }
  };
  
  // Mesaj pentru permisiunile GPS și probleme de semnal
  const renderGPSPermissionMessage = () => {
    // Afișăm mesajul pentru permisiuni lipsă
    if (!isGpsActive && !localCoordinates) {
      return (
        <div className="p-3 my-2 bg-yellow-50 border border-yellow-300 rounded-md">
          <h4 className="font-medium text-amber-700 flex items-center">
            <MapPin className="h-4 w-4 mr-1" /> Locație dezactivată
          </h4>
          <p className="text-sm text-amber-700 mt-1">
            Serviciul de locație este dezactivat sau aplicația nu are permisiuni. Vă rugăm să:
          </p>
          <ul className="text-xs text-amber-700 mt-1 list-disc pl-5">
            <li>Activați <strong>Locația</strong> în meniul de setări rapide al telefonului</li>
            <li>În setările telefonului, activați permisiunile de locație pentru aplicația iTrack</li>
            <li>Selectați opțiunea <strong>"Permite tot timpul"</strong> pentru locație</li>
            <li>Țineți telefonul în aer liber pentru un semnal GPS mai bun</li>
          </ul>
          <p className="text-xs font-bold text-amber-800 mt-2">
            IMPORTANT: Transportul nu poate porni sau funcționa corect fără permisiuni GPS!
          </p>
        </div>
      );
    }
    
    // Afișăm un mesaj de avertizare pentru semnalul GPS slab dacă sunt multe erori
    if (gpsErrorCount > 3) {
      const messageColor = gpsErrorCount > 10 ? "orange" : "blue";
      const bgColor = gpsErrorCount > 10 ? "bg-orange-50" : "bg-blue-50";
      const borderColor = gpsErrorCount > 10 ? "border-orange-300" : "border-blue-300";
      const textColor = gpsErrorCount > 10 ? "text-orange-700" : "text-blue-700";
      const textListColor = gpsErrorCount > 10 ? "text-orange-700" : "text-blue-700";
      
      return (
        <div className={`p-3 my-2 ${bgColor} border ${borderColor} rounded-md`}>
          <h4 className={`font-medium ${textColor} flex items-center`}>
            <AlertTriangle className="h-4 w-4 mr-1" /> 
            {gpsErrorCount > 10 ? "Semnal GPS foarte slab" : "Semnal GPS slab"}
          </h4>
          <p className={`text-xs ${textColor} mt-1`}>
            {gpsErrorCount > 10 
              ? "Întreruperi repetate ale semnalului GPS. Transportul continuă cu ultimele coordonate valide."
              : "S-au detectat întreruperi ale semnalului GPS. Pentru îmbunătățirea preciziei:"}
          </p>
          <ul className={`text-xs ${textListColor} mt-1 list-disc pl-5`}>
            <li>Poziționați telefonul cu ecranul în sus, fără obstrucții</li>
            <li>Verificați că funcția de locație a telefonului este activată</li>
            {gpsErrorCount > 10 && <li>Reporniți aplicația dacă problema persistă</li>}
          </ul>
          <p className={`text-xs ${textColor} mt-1`}>
            {gpsErrorCount > 20 
              ? "Sistem în modul de rezistență. Transportul este menținut activ, dar coordonatele sunt estimative."
              : "Datele GPS vor fi actualizate automat când semnalul se îmbunătățește."}
          </p>
        </div>
      );
    }
    
    return null;
  };

  // Componenta vizuală
  return (
    <div className="w-full mt-1 p-2">
      <Card className="mb-1 border-blue-100 shadow-sm">
        <CardHeader className="pb-0 pt-4">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>Localizare GPS</span>
            </div>
            <Badge 
              variant={isGpsActive ? "default" : "destructive"}
              className="px-2 py-0 h-5 text-xs flex items-center"
            >
              {isGpsActive ? "Activ" : "Inactiv"}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        {renderGPSPermissionMessage()}
        
        <CardContent className="pt-2 pb-3">
          <div className="flex flex-col gap-2 mb-2">
            {/* Rând 1: Latitudine și Longitudine */}
            <div className="grid grid-cols-2 gap-2">
              {/* Latitudine */}
              <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center text-gray-500 mb-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  <p className="text-xs font-medium">Latitudine</p>
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {gpsCoordinates?.lat ? 
                    gpsCoordinates.lat.toFixed(6) : localCoordinates?.lat ? 
                    localCoordinates.lat.toFixed(6) : "-"}
                </p>
              </div>
              
              {/* Longitudine */}
              <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center text-gray-500 mb-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  <p className="text-xs font-medium">Longitudine</p>
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {gpsCoordinates?.lng ? 
                    gpsCoordinates.lng.toFixed(6) : localCoordinates?.lng ? 
                    localCoordinates.lng.toFixed(6) : "-"}
                </p>
              </div>
            </div>
            
            {/* Rând 2: Viteză și Direcție */}
            <div className="grid grid-cols-2 gap-2">
              {/* Viteză */}
              <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center text-gray-500 mb-1">
                  <Gauge className="w-4 h-4 mr-1" />
                  <p className="text-xs font-medium">Viteză</p>
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {gpsCoordinates?.viteza !== undefined ? 
                    `${Math.round(gpsCoordinates.viteza)} km/h` : 
                    localCoordinates?.viteza !== undefined ?
                    `${Math.round(localCoordinates.viteza)} km/h` : "-"}
                </p>
              </div>
              
              {/* Direcție */}
              <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center text-gray-500 mb-1">
                  <Navigation className="w-4 h-4 mr-1" />
                  <p className="text-xs font-medium">Direcție</p>
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {gpsCoordinates?.directie !== undefined ? 
                    `${Math.round(gpsCoordinates.directie % 360)}°` : 
                    localCoordinates?.directie !== undefined ?
                    `${Math.round(localCoordinates.directie % 360)}°` : "-"}
                </p>
              </div>
            </div>
            
            {/* Rând 3: Ultima actualizare */}
            <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center text-gray-500 mb-1">
                <Clock className="w-4 h-4 mr-1" />
                <p className="text-xs font-medium">Ultima actualizare</p>
              </div>
              <p className="text-sm font-bold text-slate-800">
                {lastGpsUpdateTime ? formatTime(lastGpsUpdateTime) : formatTime(localCoordinates?.timestamp)}
              </p>
            </div>
            
            {/* Informații suplimentare */}
            <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-500">
                  <Battery className="w-4 h-4 mr-1" />
                  <p className="text-xs font-medium">Baterie: </p>
                  <p className="text-xs font-bold ml-1">
                    {deviceBattery ? `${deviceBattery}%` : "-"}
                  </p>
                </div>
                
                <div className="flex items-center">
                  {isConnected ? 
                    <Wifi className="w-4 h-4 mr-1 text-green-600" /> : 
                    <WifiOff className="w-4 h-4 mr-1 text-red-600" />
                  }
                  <Badge 
                    variant={isBackgroundActive ? "outline" : "secondary"}
                    className="px-2 py-0 h-5 text-xs flex items-center"
                  >
                    {isBackgroundActive ? "Fundal activ" : "Fundal inactiv"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
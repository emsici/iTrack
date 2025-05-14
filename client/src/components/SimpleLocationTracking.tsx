import { useTransport } from "@/context/TransportContext";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Gauge, Navigation, Battery, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function SimpleLocationTracking() {
  const { gpsCoordinates, isGpsActive, lastGpsUpdateTime, isBackgroundActive, battery, transportStatus } = useTransport();
  const [isConnected, setIsConnected] = useState(true);
  const [deviceBattery, setDeviceBattery] = useState<number | null>(null);
  const [localCoordinates, setLocalCoordinates] = useState<any>(null);
  
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
      localCoords: localCoordinates
    });
  }, [transportStatus, isGpsActive, gpsCoordinates, battery, deviceBattery, lastGpsUpdateTime, localCoordinates]);
  
  // Obținem coordonatele direct și le propagăm în context
  const { setGpsCoordinates, setLastGpsUpdateTime } = useTransport();
  
  useEffect(() => {
    const timer = setInterval(() => {
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
            
            console.log("Coordonate obținute direct și actualizate în context:", coords);
          },
          (error) => {
            console.error("Eroare obținere coordonate:", error);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    }, 2000);
    
    return () => clearInterval(timer);
  }, [setGpsCoordinates]);
  
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
        
        <CardContent className="pt-2 pb-3">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center text-gray-500 mb-1">
                <MapPin className="w-4 h-4 mr-1" />
                <p className="text-xs font-medium">Latitudine</p>
              </div>
              <p className="text-base font-bold text-slate-800">
                {gpsCoordinates?.lat ? 
                  gpsCoordinates.lat.toFixed(6) : localCoordinates?.lat ? 
                  localCoordinates.lat.toFixed(6) : "-"}
              </p>
            </div>
            
            <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center text-gray-500 mb-1">
                <MapPin className="w-4 h-4 mr-1" />
                <p className="text-xs font-medium">Longitudine</p>
              </div>
              <p className="text-base font-bold text-slate-800">
                {gpsCoordinates?.lng ? 
                  gpsCoordinates.lng.toFixed(6) : localCoordinates?.lng ? 
                  localCoordinates.lng.toFixed(6) : "-"}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center text-gray-500 mb-1">
                <Clock className="w-4 h-4 mr-1" />
                <p className="text-xs font-medium">Ultima actualizare</p>
              </div>
              <p className="text-base font-bold text-slate-800">
                {lastGpsUpdateTime ? formatTime(lastGpsUpdateTime) : formatTime(localCoordinates?.timestamp)}
              </p>
            </div>
            
            <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center text-gray-500 mb-1">
                <Gauge className="w-4 h-4 mr-1" />
                <p className="text-xs font-medium">Viteză</p>
              </div>
              <p className="text-base font-bold text-slate-800">
                {gpsCoordinates?.viteza !== undefined ? 
                  `${Math.round(gpsCoordinates.viteza)} km/h` : 
                  localCoordinates?.viteza !== undefined ?
                  `${Math.round(localCoordinates.viteza)} km/h` : "-"}
              </p>
            </div>
            
            <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center text-gray-500 mb-1">
                <Navigation className="w-4 h-4 mr-1" />
                <p className="text-xs font-medium">Direcție</p>
              </div>
              <p className="text-base font-bold text-slate-800">
                {gpsCoordinates?.directie !== undefined ? 
                  `${Math.round(gpsCoordinates.directie % 360)}°` : 
                  localCoordinates?.directie !== undefined ?
                  `${Math.round(localCoordinates.directie % 360)}°` : "-"}
              </p>
            </div>
            
            <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center text-gray-500 mb-1">
                <Battery className="w-4 h-4 mr-1" />
                <p className="text-xs font-medium">Baterie</p>
              </div>
              <p className="text-base font-bold text-slate-800">
                {deviceBattery ? `${deviceBattery}%` : "-"}
              </p>
            </div>
            
            <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md col-span-2">
              <div className="flex items-center text-gray-500 mb-1">
                {isConnected ? 
                  <Wifi className="w-4 h-4 mr-1 text-green-600" /> : 
                  <WifiOff className="w-4 h-4 mr-1 text-red-600" />
                }
                <p className="text-xs font-medium flex-1">
                  {isConnected ? "Conectat" : "Deconectat"}
                </p>
                <Badge 
                  variant={isBackgroundActive ? "outline" : "secondary"}
                  className="px-2 py-0 h-5 text-xs flex items-center"
                >
                  {isBackgroundActive ? "Fundal activ" : "Fundal inactiv"}
                </Badge>
              </div>
              <p className="text-sm">
                {isConnected ? 
                  "Datele sunt transmise în timp real." : 
                  "Datele vor fi transmise când internetul va fi disponibil."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
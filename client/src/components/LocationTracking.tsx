import { useTransport } from "@/context/TransportContext";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Gauge, Navigation, Battery, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

export default function LocationTracking() {
  const { gpsCoordinates, isGpsActive, lastGpsUpdateTime, isBackgroundActive, battery, transportStatus } = useTransport();
  const [isConnected, setIsConnected] = useState(true);
  
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
  
  // Facem un log pentru a depana problema
  console.log("DEPANARE GPS: ", {
    transportStatus,
    isGpsActive,
    hasCoordinates: !!gpsCoordinates,
    coordinates: gpsCoordinates
  });
  
  const formatTime = (timeString: string | null) => {
    if (!timeString) return "N/A";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString();
    } catch (e) {
      return "N/A";
    }
  };

  // Pentru a face afișarea corectă a statusului GPS, considerăm GPS-ul activ
  // doar când transportul este în stare activă și avem coordonate valide
  const isGpsReallyActive = transportStatus === "active" && gpsCoordinates !== null;

  return (
    <Card className="mb-6 overflow-hidden border-0 shadow-md rounded-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 pb-3 pt-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-white flex items-center text-lg">
            <MapPin className="h-5 w-5 mr-2" />
            Localizare GPS
          </CardTitle>
          
          <div className="flex gap-2">
            {!isConnected && (
              <Badge variant="outline" className="bg-yellow-500 text-white border-0 animate-pulse">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
            
            <Badge 
              variant="outline" 
              className={isGpsReallyActive 
                ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-sm" 
                : "bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-sm"
              }
            >
              <div className="flex items-center">
                {isGpsReallyActive && <div className="h-2 w-2 bg-white rounded-full mr-1.5 animate-pulse"></div>}
                GPS {isGpsReallyActive ? "Activ" : "Inactiv"}
              </div>
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-5 pb-5 bg-gradient-to-b from-slate-50 to-white">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center mb-2 text-blue-700">
              <MapPin className="w-4 h-4 mr-2" />
              <p className="text-sm font-medium">Latitudine</p>
            </div>
            <p className="text-lg font-bold text-slate-800 tracking-tight">
              {isGpsReallyActive && gpsCoordinates?.lat ? gpsCoordinates.lat.toFixed(6) : "-"}
            </p>
          </div>
          
          <div className="p-4 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center mb-2 text-blue-700">
              <MapPin className="w-4 h-4 mr-2" />
              <p className="text-sm font-medium">Longitudine</p>
            </div>
            <p className="text-lg font-bold text-slate-800 tracking-tight">
              {isGpsReallyActive && gpsCoordinates?.lng ? gpsCoordinates.lng.toFixed(6) : "-"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center mb-1 text-blue-700">
              <Gauge className="w-4 h-4 mr-1" />
              <p className="text-xs font-medium">Viteză</p>
            </div>
            <p className="text-base font-bold text-slate-800">
              {isGpsReallyActive && gpsCoordinates?.viteza !== undefined ? `${gpsCoordinates.viteza.toFixed(1)} km/h` : "-"}
            </p>
          </div>
          
          <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center mb-1 text-blue-700">
              <Navigation className="w-4 h-4 mr-1" />
              <p className="text-xs font-medium">Direcție</p>
            </div>
            <p className="text-base font-bold text-slate-800">
              {isGpsReallyActive && gpsCoordinates?.directie !== undefined ? `${gpsCoordinates.directie}°` : "-"}
            </p>
          </div>
          
          <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center mb-1 text-blue-700">
              <Battery className="w-4 h-4 mr-1" />
              <p className="text-xs font-medium">Baterie</p>
            </div>
            <p className="text-base font-bold text-slate-800">
              {isGpsReallyActive && battery ? `${battery}%` : "-"}
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center text-blue-700">
            <Clock className="w-4 h-4 mr-2" />
            <p className="text-sm font-medium">Ultima actualizare</p>
          </div>
          <p className="text-base font-semibold text-slate-800">
            {isGpsReallyActive && lastGpsUpdateTime ? formatTime(lastGpsUpdateTime) : "-"}
          </p>
        </div>
      
        {isGpsReallyActive && isBackgroundActive && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center justify-center">
            <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <p className="text-green-700 text-sm font-medium">Funcționează în background</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

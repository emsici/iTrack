import { useTransport } from "@/context/TransportContext";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Gauge, Navigation, Battery, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { forceTransportActive } from "@/lib/transportHelper";
import { toast } from "@/hooks/use-toast";

export default function LocationTracking() {
  const { gpsCoordinates, isGpsActive, lastGpsUpdateTime, isBackgroundActive, battery, transportStatus } = useTransport();
  const [isConnected, setIsConnected] = useState(true);
  const [deviceBattery, setDeviceBattery] = useState<number | null>(null);
  
  // Debug pentru starea GPS
  useEffect(() => {
    console.log("DEPANARE GPS (LocationTracking): ", {
      transportStatus,
      isGpsActive,
      hasCoordinates: !!gpsCoordinates,
      battery,
      deviceBattery,
      lastUpdateTime: lastGpsUpdateTime
    });
  }, [transportStatus, isGpsActive, gpsCoordinates, battery, deviceBattery, lastGpsUpdateTime]);
  
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
  
  // Obținem nivelul bateriei de la dispozitiv dacă API-ul este disponibil
  useEffect(() => {
    // Încercăm să obținem nivelul real al bateriei
    const getBatteryLevel = async () => {
      try {
        // Pentru browsere care suportă Battery API
        if ('getBattery' in navigator) {
          const batteryManager = await (navigator as any).getBattery();
          setDeviceBattery(Math.round(batteryManager.level * 100));
          
          // Ascultăm pentru schimbări în nivelul bateriei
          batteryManager.addEventListener('levelchange', () => {
            setDeviceBattery(Math.round(batteryManager.level * 100));
          });
        }
      } catch (error) {
        console.error('Eroare la obținerea nivelului bateriei:', error);
      }
    };
    
    getBatteryLevel();
  }, []);
  
  // Facem un log pentru a depana problema
  console.log("DEPANARE GPS (LocationTracking): ", {
    transportStatus,
    isGpsActive,
    hasCoordinates: !!gpsCoordinates,
    battery,
    deviceBattery,
    lastUpdateTime: lastGpsUpdateTime,
    coords: gpsCoordinates ? {
      lat: gpsCoordinates.lat,
      lng: gpsCoordinates.lng,
      timestamp: gpsCoordinates.timestamp
    } : null
  });
  
  // Forțăm starea activă dacă suntem activi dar nu avem coordonate
  // Acest lucru va asigura că starea rămâne activă chiar și după restart
  useEffect(() => {
    if (transportStatus === "active") {
      // Folosim metoda importată direct în loc de require
      forceTransportActive();
      console.log("[LocationTracking] Forțare actualizare stare transport activă");
      
      // Notificare utilizator despre starea GPS-ului
      if (isGpsActive && !gpsCoordinates) {
        toast({
          title: "GPS activ",
          description: "Se așteaptă coordonatele GPS. Vă rugăm așteptați...",
          duration: 3000,
        });
      }
    }
  }, [transportStatus, isGpsActive, gpsCoordinates]);
  
  const formatTime = (timeString: string | null) => {
    if (!timeString) return "N/A";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString();
    } catch (e) {
      return "N/A";
    }
  };

  // CORECȚIE: Considerăm GPS-ul activ și în starea de pauză dacă avem coordonate
  // Acest lucru este important pentru a evita confuzia utilizatorului
  const isGpsReallyActive = (transportStatus === "active" || transportStatus === "paused") && (isGpsActive || !!gpsCoordinates);
  
  // CORECȚIE: Afișăm componenta și în starea de pauză pentru a oferi feedback utilizatorului
  if (transportStatus !== "active" && transportStatus !== "paused") {
    return null;
  }
  
  // Afișăm starea actuală pentru debugging
  useEffect(() => {
    console.log("Stare GPS actualizată:", isGpsReallyActive ? "ACTIV" : "INACTIV", "Transport:", transportStatus);
  }, [isGpsReallyActive, transportStatus, isGpsActive]);

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
              {transportStatus === "active" && gpsCoordinates?.lat ? gpsCoordinates.lat.toFixed(6) : "-"}
            </p>
          </div>
          
          <div className="p-4 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center mb-2 text-blue-700">
              <MapPin className="w-4 h-4 mr-2" />
              <p className="text-sm font-medium">Longitudine</p>
            </div>
            <p className="text-lg font-bold text-slate-800 tracking-tight">
              {transportStatus === "active" && gpsCoordinates?.lng ? gpsCoordinates.lng.toFixed(6) : "-"}
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
              {transportStatus === "active" && gpsCoordinates?.viteza !== undefined ? `${gpsCoordinates.viteza.toFixed(1)} km/h` : "-"}
            </p>
          </div>
          
          <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center mb-1 text-blue-700">
              <Navigation className="w-4 h-4 mr-1" />
              <p className="text-xs font-medium">Direcție</p>
            </div>
            <p className="text-base font-bold text-slate-800">
              {transportStatus === "active" && gpsCoordinates?.directie !== undefined ? 
                `${Math.round(gpsCoordinates.directie % 360)}°` : "-"}
            </p>
          </div>
          
          <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center mb-1 text-blue-700">
              <Clock className="w-4 h-4 mr-1" />
              <p className="text-xs font-medium">Actualizare</p>
            </div>
            <p className="text-base font-bold text-slate-800">
              {transportStatus === "active" && lastGpsUpdateTime ? formatTime(lastGpsUpdateTime) : "-"}
            </p>
          </div>
        </div>
        

      
        {/* Indicator baterie - folosim valoarea reală a dispozitivului dacă este disponibilă */}
        <div className="mt-4 bg-white rounded-lg border border-blue-100 shadow-sm p-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-blue-700">
              <Battery className="w-4 h-4 mr-2" />
              <p className="text-sm font-medium">Baterie dispozitiv</p>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden mr-2">
                <div 
                  className={`h-full rounded-full ${
                    (deviceBattery !== null ? deviceBattery : battery) > 20 
                      ? 'bg-green-500' 
                      : 'bg-red-500 animate-pulse'
                  }`}
                  style={{ width: `${deviceBattery !== null ? deviceBattery : battery}%` }}
                ></div>
              </div>
              <span className="text-sm font-bold text-slate-700">
                {deviceBattery !== null ? deviceBattery : battery}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useTransport } from "@/context/TransportContext";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Gauge, Navigation, Battery } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LocationTracking() {
  const { gpsCoordinates, isGpsActive, lastGpsUpdateTime, isBackgroundActive, battery } = useTransport();
  
  const formatTime = (timeString: string | null) => {
    if (!timeString) return "N/A";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString();
    } catch (e) {
      return "N/A";
    }
  };

  return (
    <Card className="mb-6 overflow-hidden border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 pb-2 pt-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-white flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Localizare GPS
          </CardTitle>
          
          <Badge 
            variant="outline" 
            className={isGpsActive 
              ? "bg-green-600 text-white border-0" 
              : "bg-red-600 text-white border-0"
            }
          >
            GPS {isGpsActive ? "Activ" : "Inactiv"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-5 pb-5 bg-gradient-to-b from-blue-50 to-white">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center mb-2 text-blue-700">
              <MapPin className="w-4 h-4 mr-2" />
              <p className="text-sm font-medium">Latitudine</p>
            </div>
            <p className="text-lg font-bold text-slate-800 tracking-tight">
              {isGpsActive && gpsCoordinates?.lat ? gpsCoordinates.lat.toFixed(6) : "-"}
            </p>
          </div>
          
          <div className="p-4 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center mb-2 text-blue-700">
              <MapPin className="w-4 h-4 mr-2" />
              <p className="text-sm font-medium">Longitudine</p>
            </div>
            <p className="text-lg font-bold text-slate-800 tracking-tight">
              {isGpsActive && gpsCoordinates?.lng ? gpsCoordinates.lng.toFixed(6) : "-"}
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
              {isGpsActive && gpsCoordinates?.viteza !== undefined ? `${gpsCoordinates.viteza.toFixed(1)} km/h` : "-"}
            </p>
          </div>
          
          <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center mb-1 text-blue-700">
              <Navigation className="w-4 h-4 mr-1" />
              <p className="text-xs font-medium">Direcție</p>
            </div>
            <p className="text-base font-bold text-slate-800">
              {isGpsActive && gpsCoordinates?.directie !== undefined ? `${gpsCoordinates.directie}°` : "-"}
            </p>
          </div>
          
          <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center mb-1 text-blue-700">
              <Battery className="w-4 h-4 mr-1" />
              <p className="text-xs font-medium">Baterie</p>
            </div>
            <p className="text-base font-bold text-slate-800">
              {isGpsActive ? `${battery}%` : "-"}
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center text-blue-700">
            <Clock className="w-4 h-4 mr-2" />
            <p className="text-sm font-medium">Ultima actualizare</p>
          </div>
          <p className="text-base font-semibold text-slate-800">
            {isGpsActive && lastGpsUpdateTime ? formatTime(lastGpsUpdateTime) : "-"}
          </p>
        </div>
      
        {isGpsActive && isBackgroundActive && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center justify-center">
            <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <p className="text-green-700 text-sm font-medium">Funcționează în background</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

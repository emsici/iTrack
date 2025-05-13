import { useTransport } from "@/context/TransportContext";
import { Badge } from "@/components/ui/badge";
import { MapPin, Activity, Clock, Navigation } from "lucide-react";

export default function LocationTracking() {
  const { gpsCoordinates, isGpsActive, lastGpsUpdateTime, isBackgroundActive } = useTransport();
  
  const formatTime = (timeString: string | null) => {
    if (!timeString) return "--:--:--";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString();
    } catch (e) {
      return timeString;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-secondary-800">Monitorizare GPS</h3>
        {isGpsActive && isBackgroundActive && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Funcționează în background
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2 bg-blue-50 rounded-md">
          <div className="flex items-center mb-1">
            <MapPin className="h-3 w-3 mr-1 text-blue-500" />
            <p className="text-xs text-secondary-500">Latitudine</p>
          </div>
          <p className="font-medium">{gpsCoordinates?.lat.toFixed(6) || "-"}</p>
        </div>
        
        <div className="p-2 bg-blue-50 rounded-md">
          <div className="flex items-center mb-1">
            <MapPin className="h-3 w-3 mr-1 text-blue-500" />
            <p className="text-xs text-secondary-500">Longitudine</p>
          </div>
          <p className="font-medium">{gpsCoordinates?.lng.toFixed(6) || "-"}</p>
        </div>
        
        <div className="p-2 bg-blue-50 rounded-md">
          <div className="flex items-center mb-1">
            <Activity className="h-3 w-3 mr-1 text-green-500" />
            <p className="text-xs text-secondary-500">Viteză</p>
          </div>
          <p className="font-medium">{gpsCoordinates ? `${gpsCoordinates.viteza.toFixed(1)} km/h` : "0.0 km/h"}</p>
        </div>
        
        <div className="p-2 bg-blue-50 rounded-md">
          <div className="flex items-center mb-1">
            <Clock className="h-3 w-3 mr-1 text-orange-500" />
            <p className="text-xs text-secondary-500">Ultima actualizare</p>
          </div>
          <p className="font-medium">{formatTime(lastGpsUpdateTime)}</p>
        </div>
      </div>
    </div>
  );
}

import { useTransport } from "@/context/TransportContext";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Gauge } from "lucide-react";

export default function LocationTracking() {
  const { gpsCoordinates, isGpsActive, lastGpsUpdateTime, isBackgroundActive } = useTransport();
  
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
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-primary-700">Localizare GPS</h3>
        
        <Badge 
          variant="outline" 
          className={isGpsActive 
            ? "bg-green-50 text-green-700 border-green-200" 
            : "bg-red-50 text-red-700 border-red-200"
          }
        >
          GPS {isGpsActive ? "Activ" : "Inactiv"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="p-3 bg-secondary-50 rounded-md border border-secondary-100">
          <div className="flex items-center mb-1">
            <MapPin className="w-3 h-3 text-primary-600 mr-1" />
            <p className="text-xs text-secondary-600 font-medium">Latitudine</p>
          </div>
          <p className="text-lg font-bold text-secondary-900">{gpsCoordinates?.lat ? gpsCoordinates.lat.toFixed(6) : "N/A"}</p>
        </div>
        
        <div className="p-3 bg-secondary-50 rounded-md border border-secondary-100">
          <div className="flex items-center mb-1">
            <MapPin className="w-3 h-3 text-primary-600 mr-1" />
            <p className="text-xs text-secondary-600 font-medium">Longitudine</p>
          </div>
          <p className="text-lg font-bold text-secondary-900">{gpsCoordinates?.lng ? gpsCoordinates.lng.toFixed(6) : "N/A"}</p>
        </div>
        
        <div className="p-3 bg-secondary-50 rounded-md border border-secondary-100">
          <div className="flex items-center mb-1">
            <Gauge className="w-3 h-3 text-primary-600 mr-1" />
            <p className="text-xs text-secondary-600 font-medium">Viteză</p>
          </div>
          <p className="text-lg font-bold text-secondary-900">
            {gpsCoordinates?.viteza !== undefined ? `${gpsCoordinates.viteza.toFixed(1)} km/h` : "N/A"}
          </p>
        </div>
        
        <div className="p-3 bg-secondary-50 rounded-md border border-secondary-100">
          <div className="flex items-center mb-1">
            <Clock className="w-3 h-3 text-primary-600 mr-1" />
            <p className="text-xs text-secondary-600 font-medium">Ultima actualizare</p>
          </div>
          <p className="text-lg font-bold text-secondary-900">{formatTime(lastGpsUpdateTime)}</p>
        </div>
      </div>
      
      {isGpsActive && isBackgroundActive && (
        <Badge variant="outline" className="w-full justify-center bg-green-50 text-green-700 border-green-200 py-1">
          Funcționează în background
        </Badge>
      )}
    </div>
  );
}

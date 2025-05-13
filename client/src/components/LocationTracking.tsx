import { useTransport } from "@/context/TransportContext";
import { Badge } from "@/components/ui/badge";

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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-secondary-800">iTrack</h3>


        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 p-3 bg-secondary-50 rounded-md">
              <p className="text-xs text-secondary-500 mb-1">Latitudine</p>
              <p className="font-medium">{gpsCoordinates?.lat.toFixed(6) || "-"}</p>
            </div>
            <div className="flex-1 p-3 bg-secondary-50 rounded-md">
              <p className="text-xs text-secondary-500 mb-1">Longitudine</p>
              <p className="font-medium">{gpsCoordinates?.lng.toFixed(6) || "-"}</p>
            </div>
            <div className="flex-1 p-3 bg-secondary-50 rounded-md">
              <p className="text-xs text-secondary-500 mb-1">Viteză</p>
              <p className="font-medium">{gpsCoordinates ? `${gpsCoordinates.viteza.toFixed(1)} km/h` : "0 km/h"}</p>
            </div>
            <div className="flex-1 p-3 bg-secondary-50 rounded-md">
              <p className="text-xs text-secondary-500 mb-1">Ultima actualizare</p>
              <p className="font-medium">{formatTime(lastGpsUpdateTime)}</p>
            </div>
          </div>
        </div>
        {isGpsActive && isBackgroundActive && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Funcționează în background
          </Badge>
        )}
      </div>

  
  );
}

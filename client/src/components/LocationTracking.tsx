import { useTransport } from "@/context/TransportContext";

export default function LocationTracking() {
  const { gpsCoordinates, isGpsActive, lastGpsUpdateTime } = useTransport();
  
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
      <h3 className="text-lg font-medium text-secondary-800 mb-4">iTrack</h3>
      
      <div className="bg-secondary-100 rounded-lg h-56 relative overflow-hidden mb-4">
        {/* Map placeholder - in a real implementation, this would be a proper map */}
        <img 
          src="https://images.unsplash.com/photo-1604357209793-fca5dca89f97?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
          alt="GPS tracking map" 
          className="w-full h-full object-cover" 
        />
        
        {/* Overlay that shows when GPS is inactive */}
        {!isGpsActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
            <span className="text-secondary-500 text-sm">Tracking GPS va apărea când cursa este activă</span>
          </div>
        )}
      </div>
      
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
  );
}

import { useCallback } from "react";
import { useTransport } from "@/context/TransportContext";
import { useAuth } from "@/context/AuthContext";
import { Battery, Signal, Wifi, MapPin, LogOut } from "lucide-react";
import { Link } from "wouter";

export default function MobileHeader() {
  const { isGpsActive, battery, gpsCoordinates } = useTransport();
  const { logout, vehicleInfo } = useAuth();
  
  const getBatteryColor = useCallback(() => {
    if (battery > 50) return "text-success";
    if (battery > 20) return "text-warning";
    return "text-destructive";
  }, [battery]);
  
  const getGpsIndicatorColor = useCallback(() => {
    return isGpsActive ? "text-success" : "text-destructive";
  }, [isGpsActive]);
  
  const handleLogout = () => {
    if (confirm("Sigur doriți să vă deconectați?")) {
      logout();
    }
  };

  return (
    <header className="bg-secondary-800 text-white p-3 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="rounded-full bg-secondary-700 w-8 h-8 flex items-center justify-center mr-2">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold">iTrack</h1>
            <p className="text-xs text-secondary-300">{vehicleInfo?.nr || ''}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Signal className={`h-4 w-4 ${getGpsIndicatorColor()}`} />
          <Wifi className="h-4 w-4 text-secondary-300" />
          <div className="flex items-center">
            <Battery className={`h-4 w-4 ${getBatteryColor()}`} />
            <span className="text-xs ml-1">{Math.round(battery)}%</span>
          </div>
          <button onClick={handleLogout} className="ml-2 text-secondary-300 hover:text-white">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Sub-header with navigation */}
      <nav className="flex justify-around mt-2 pt-2 border-t border-secondary-700">
        <Link href="/transport" className="text-xs px-3 py-1.5 bg-primary text-white font-medium rounded-full hover:bg-primary-600">
          Transport
        </Link>
        <Link href="/about" className="text-xs px-3 py-1.5 bg-secondary-600 text-white font-medium rounded-full hover:bg-secondary-700">
          Despre
        </Link>
      </nav>
    </header>
  );
}
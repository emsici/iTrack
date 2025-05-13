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
    <header className="bg-blue-700 text-white p-3 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="rounded-full bg-white w-8 h-8 flex items-center justify-center mr-2">
            <MapPin className="h-4 w-4 text-blue-700" />
          </div>
          <div>
            <h1 className="text-lg font-bold">iTrack</h1>
            <p className="text-xs text-blue-200">{vehicleInfo?.nr || ''}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <Signal className={`h-4 w-4 ${isGpsActive ? "text-green-300" : "text-red-300"}`} />
            <span className="text-xs ml-1 text-white">{isGpsActive ? "Activ" : "Inactiv"}</span>
          </div>
          
          <div className="flex items-center">
            <Battery className={`h-4 w-4 ${battery > 50 ? "text-green-300" : battery > 20 ? "text-yellow-300" : "text-red-300"}`} />
            <span className="text-xs ml-1 text-white">{Math.round(battery)}%</span>
          </div>
          
          <button onClick={handleLogout} className="ml-2 bg-blue-800 p-1.5 rounded-full hover:bg-blue-900">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Sub-header with navigation */}
      <nav className="flex justify-around mt-2 pt-2 border-t border-blue-600">
        <Link href="/transport" className="text-xs flex-1 mx-1 py-1.5 bg-white text-blue-700 font-medium rounded-md hover:bg-blue-50 text-center">
          Transport
        </Link>
        <Link href="/about" className="text-xs flex-1 mx-1 py-1.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-500 text-center">
          Despre
        </Link>
      </nav>
    </header>
  );
}
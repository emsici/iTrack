import { useCallback, useState, useEffect } from "react";
import { useTransport } from "@/context/TransportContext";
import { useAuth } from "@/context/AuthContext";
import { Battery, Signal, Wifi, MapPin, LogOut, Truck, Info } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function MobileHeader() {
  const { isGpsActive, battery, gpsCoordinates } = useTransport();
  const { logout, vehicleInfo } = useAuth();
  const [location] = useLocation();
  
  const getBatteryColor = useCallback(() => {
    if (battery > 50) return "text-success";
    if (battery > 20) return "text-warning";
    return "text-destructive";
  }, [battery]);
  
  const getGpsIndicatorColor = useCallback(() => {
    return isGpsActive ? "text-success" : "text-destructive";
  }, [isGpsActive]);
  
  const isActivePage = useCallback((path: string) => {
    return location === path;
  }, [location]);
  
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
      
      {/* Tab navigation menu */}
      <nav className="mt-3 pt-2 border-t border-blue-600">
        <div className="flex justify-around relative">
          {/* Active Tab Indicator - se mișcă în funcție de tab-ul activ */}
          <div className={`absolute bottom-0 h-1 bg-white rounded-t-md transition-all duration-300 w-1/2 ${
            isActivePage('/transport') ? 'left-0' : 'left-1/2'
          }`}></div>
          
          {/* Transport Tab */}
          <Link href="/transport" className={`relative flex items-center justify-center py-2 flex-1 transition-colors ${
            isActivePage('/transport') 
              ? 'text-white font-medium' 
              : 'text-blue-200 hover:text-white'
          }`}>
            <Truck className={`h-4 w-4 mr-1 ${isActivePage('/transport') ? 'text-white' : 'text-blue-200'}`} />
            <span className="text-sm">Transport</span>
          </Link>
          
          {/* Despre Tab */}
          <Link href="/about" className={`relative flex items-center justify-center py-2 flex-1 transition-colors ${
            isActivePage('/about') 
              ? 'text-white font-medium' 
              : 'text-blue-200 hover:text-white'
          }`}>
            <Info className={`h-4 w-4 mr-1 ${isActivePage('/about') ? 'text-white' : 'text-blue-200'}`} />
            <span className="text-sm">Despre</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
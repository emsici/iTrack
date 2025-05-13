import { useCallback, useState, useEffect } from "react";
import { useTransport } from "@/context/TransportContext";
import { useAuth } from "@/context/AuthContext";
import { Battery, Signal, Wifi, MapPin, LogOut, Truck, Info } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function MobileHeader() {
  const { isGpsActive, battery, gpsCoordinates } = useTransport();
  const { logout, vehicleInfo, registerVehicle } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [isEditingVehicle, setIsEditingVehicle] = useState<boolean>(false);
  const [newRegistrationNumber, setNewRegistrationNumber] = useState<string>('');
  
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
  
  // Funcție pentru a începe editarea numărului de înmatriculare
  const handleEditVehicle = () => {
    if (vehicleInfo?.nr) {
      setNewRegistrationNumber(vehicleInfo.nr);
      setIsEditingVehicle(true);
    }
  };
  
  // Funcție pentru a salva noul număr de înmatriculare
  const handleSaveVehicle = async () => {
    if (newRegistrationNumber.trim() !== '') {
      try {
        const result = await registerVehicle(newRegistrationNumber.trim());
        if (result) {
          toast({
            title: "Vehicul actualizat",
            description: `Numărul de înmatriculare a fost schimbat în ${newRegistrationNumber}`,
            variant: "default",
          });
          setIsEditingVehicle(false);
        } else {
          toast({
            title: "Actualizare eșuată",
            description: "Nu s-a putut actualiza numărul de înmatriculare. Verificați dacă numărul este valid.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Eroare la modificarea numărului de înmatriculare:", error);
        toast({
          title: "Eroare",
          description: "A apărut o eroare la actualizarea vehiculului. Încercați din nou.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Eroare",
        description: "Numărul de înmatriculare nu poate fi gol.",
        variant: "destructive",
      });
    }
  };
  
  // Funcție pentru a anula editarea
  const handleCancelEdit = () => {
    setIsEditingVehicle(false);
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
            {isEditingVehicle ? (
              <div className="flex items-center">
                <input 
                  type="text" 
                  value={newRegistrationNumber} 
                  onChange={(e) => setNewRegistrationNumber(e.target.value)}
                  className="text-xs bg-blue-600 text-white rounded px-1 py-0.5 w-24 border border-blue-400"
                />
                <button 
                  onClick={handleSaveVehicle} 
                  className="text-xs bg-green-600 rounded px-1 ml-1"
                >
                  ✓
                </button>
                <button 
                  onClick={handleCancelEdit} 
                  className="text-xs bg-red-600 rounded px-1 ml-1"
                >
                  ✕
                </button>
              </div>
            ) : (
              <p 
                className="text-xs text-blue-200 cursor-pointer hover:underline" 
                onClick={handleEditVehicle}
              >
                {vehicleInfo?.nr || ''} (click pentru editare)
              </p>
            )}
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
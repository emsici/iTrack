import { useCallback, useState, useEffect } from "react";
import { useTransport } from "@/context/TransportContext";
import { useAuth } from "@/context/AuthContext";
import { Battery, Signal, Wifi, MapPin, LogOut, Truck, Info, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { requestGpsPermissions } from "@/lib/capacitorService";
import { useToast } from "@/hooks/use-toast";

export default function MobileHeader() {
  const { isGpsActive, battery, gpsCoordinates, transportStatus } = useTransport();
  const { logout, vehicleInfo, registerVehicle } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [isEditingVehicle, setIsEditingVehicle] = useState<boolean>(false);
  const [newRegistrationNumber, setNewRegistrationNumber] = useState<string>('');
  const [requestingGps, setRequestingGps] = useState<boolean>(false);
  
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
    // Validăm numărul de înmatriculare (doar litere mari și cifre, fără caractere speciale)
    const trimmedValue = newRegistrationNumber.trim().toUpperCase();
    
    if (trimmedValue === '') {
      toast({
        title: "Eroare",
        description: "Numărul de înmatriculare nu poate fi gol.",
        variant: "destructive",
      });
      return;
    }
      
    // Validăm formatul (doar litere și cifre)
    if (!/^[A-Z0-9]+$/.test(trimmedValue)) {
      toast({
        title: "Format invalid",
        description: "Numărul de înmatriculare trebuie să conțină doar litere și cifre, fără spații sau caractere speciale.",
        variant: "destructive",
      });
      return;
    }
      
    try {
      // Facem apelul API cu noul număr, fără simulare
      const result = await registerVehicle(trimmedValue);
        
      if (result) {
        toast({
          title: "Vehicul actualizat",
          description: `Numărul de înmatriculare a fost schimbat în ${trimmedValue}`,
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
        description: "A apărut o eroare la actualizarea vehiculului. Verificați conexiunea la internet și încercați din nou.",
        variant: "destructive",
      });
    }
  };
  
  // Funcție pentru a anula editarea
  const handleCancelEdit = () => {
    setIsEditingVehicle(false);
  };

  return (
    <header className="text-white shadow-md mobile-header">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="rounded-full bg-white w-8 h-8 flex items-center justify-center mr-2">
            <MapPin className="h-4 w-4 text-blue-700" />
          </div>
          <div>
            <h1 className="text-lg font-bold">iTrack</h1>
            {!isEditingVehicle ? (
              <p 
                className="text-xs text-blue-200 cursor-pointer hover:underline flex items-center" 
                onClick={handleEditVehicle}
              >
                <span className="mr-1">{vehicleInfo?.nr || ''}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </p>
            ) : null}
          </div>
          
          {/* Modal de editare număr înmatriculare - apare doar când este în modul editare */}
          {isEditingVehicle && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
                <div className="bg-blue-700 p-4 text-white">
                  <h3 className="text-lg font-medium">Modificare număr înmatriculare</h3>
                </div>
                
                <div className="p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Introduceți noul număr de înmatriculare:
                  </label>
                  <input 
                    type="text" 
                    value={newRegistrationNumber} 
                    onChange={(e) => setNewRegistrationNumber(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-gray-900 bg-white font-medium"
                    autoFocus
                    placeholder="Ex: B01AAA"
                  />
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button 
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Anulare
                    </button>
                    <button 
                      onClick={handleSaveVehicle}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Salvare
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <Signal className={`h-4 w-4 ${transportStatus === "active" ? "text-green-300" : "text-red-300"}`} />
            <span className="text-xs ml-1 text-white">{transportStatus === "active" ? "Activ" : "Inactiv"}</span>
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
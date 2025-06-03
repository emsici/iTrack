import { useCallback, useState, useEffect } from "react";
import { useTransport } from "@/context/TransportContext";
import { useAuth } from "@/context/AuthContext";
import { Battery, Signal, Wifi, MapPin, LogOut, Truck, Info, AlertCircle, Download } from "lucide-react";
import { Link, useLocation } from "wouter";
import { requestGpsPermissions } from "@/lib/capacitorService";
import { getGpsAvailability } from "@/lib/connectivityService";
import { useToast } from "@/hooks/use-toast";

interface MobileHeaderProps {
  onInfoClick?: () => void;
}

export default function MobileHeader({ onInfoClick }: MobileHeaderProps = {}) {
  const { isGpsActive, battery, gpsCoordinates, transportStatus, lastGpsUpdateTime } = useTransport();
  const { logout, vehicleInfo, registerVehicle } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [isEditingVehicle, setIsEditingVehicle] = useState<boolean>(false);
  const [newRegistrationNumber, setNewRegistrationNumber] = useState<string>('');
  const [requestingGps, setRequestingGps] = useState<boolean>(false);
  const [gpsPermissionsAvailable, setGpsPermissionsAvailable] = useState<boolean>(true);
  
  // Calculăm starea GPS în funcție de starea transportului
  const [showGpsActive, setShowGpsActive] = useState<boolean>(false);
  
  useEffect(() => {
    // Sincronizare stare GPS - verificăm dacă GPS-ul funcționează efectiv
    const hasActiveGps = gpsCoordinates !== null && lastGpsUpdateTime !== null;
    const isTransportActive = transportStatus === "active";
    
    // GPS-ul este considerat activ dacă:
    // 1. Transportul este activ SAU avem coordonate GPS disponibile
    // 2. Avem coordonate recente (în ultimele 2 minute)
    const now = new Date().getTime();
    const lastUpdate = lastGpsUpdateTime ? new Date(lastGpsUpdateTime).getTime() : 0;
    const isGpsRecent = (now - lastUpdate) < 120000; // 2 minute
    
    const effectiveGpsActive = hasActiveGps && (isTransportActive || isGpsRecent);
    setShowGpsActive(effectiveGpsActive);
    
    console.log("MobileHeader: Sincronizare stare GPS:", {
      transportStatus, 
      isGpsActive, 
      hasCoordinates: !!gpsCoordinates,
      isGpsRecent,
      effectiveGpsActive,
      lastGpsUpdateTime
    });
  }, [transportStatus, isGpsActive, gpsCoordinates, lastGpsUpdateTime, location]);
  
  // Eliminat funcția getBatteryColor care nu mai este necesară
  
  const getGpsIndicatorColor = useCallback(() => {
    return showGpsActive ? "text-success" : "text-destructive";
  }, [showGpsActive]);
  
  const isActivePage = useCallback((path: string) => {
    return location === path;
  }, [location]);
  
  const handleLogout = () => {
    if (confirm("Sigur doriți să vă deconectați?")) {
      logout();
    }
  };
  
  // Funcție pentru solicitarea manuală a permisiunilor GPS
  const handleRequestGpsPermissions = async () => {
    if (requestingGps) return;
    
    setRequestingGps(true);
    try {
      toast({
        title: "Solicitare permisiuni GPS",
        description: "Se solicită acces la localizare...",
      });
      
      const result = await requestGpsPermissions();
      
      if (result) {
        toast({
          title: "Permisiuni acordate",
          description: "Permisiunile GPS au fost acordate cu succes!",
          variant: "default",
        });
        
        // Actualizăm starea permisiunilor GPS pentru a reîncerca inițializarea
        setGpsPermissionsAvailable(true);
        
        // Reîncărcăm pagina pentru a reinițializa GPS-ul cu noile permisiuni
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Permisiuni refuzate",
          description: "Pentru a utiliza aplicația, vă rugăm să activați localizarea în setările dispozitivului.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Eroare la solicitarea permisiunilor GPS:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la solicitarea permisiunilor GPS. Verificați setările dispozitivului.",
        variant: "destructive",
      });
    } finally {
      setRequestingGps(false);
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
      console.log("Validare format eșuată pentru:", trimmedValue, "Caractere găsite:", trimmedValue.split(''));
      toast({
        title: "Format invalid",
        description: "Numărul de înmatriculare trebuie să conțină doar litere și cifre, fără spații sau caractere speciale.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Validare format reușită pentru:", trimmedValue);
      
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

  // Funcție pentru export loguri complet
  const handleExportLogs = async () => {
    try {
      const logs = [];
      
      // Header export
      logs.push(`=== EXPORT LOGURI iTrack - ${new Date().toLocaleString()} ===`);
      logs.push('');
      
      // Informații sistem
      logs.push('=== INFORMAȚII SISTEM ===');
      logs.push(`Platform: ${navigator.platform}`);
      logs.push(`User Agent: ${navigator.userAgent}`);
      logs.push(`Language: ${navigator.language}`);
      logs.push(`Online: ${navigator.onLine}`);
      logs.push(`Cookies: ${navigator.cookieEnabled}`);
      logs.push('');
      
      // Starea aplicației
      logs.push('=== STAREA APLICAȚIEI ===');
      logs.push(`Transport Status: ${transportStatus}`);
      logs.push(`GPS Active: ${isGpsActive}`);
      logs.push(`Battery: ${battery}%`);
      logs.push(`Has Coordinates: ${!!gpsCoordinates}`);
      logs.push(`Vehicle: ${vehicleInfo?.nr || 'N/A'}`);
      
      if (gpsCoordinates) {
        logs.push('');
        logs.push('=== ULTIMA POZIȚIE GPS ===');
        logs.push(JSON.stringify(gpsCoordinates, null, 2));
      }
      logs.push('');
      
      // Test GPS în timp real
      logs.push('=== TEST GPS LIVE ===');
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        });
        logs.push('GPS Standard Browser: SUCCESS');
        logs.push(`Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`);
        logs.push(`Accuracy: ${position.coords.accuracy}m`);
      } catch (gpsError: any) {
        logs.push('GPS Standard Browser: FAILED');
        logs.push(`Eroare: ${gpsError?.message || 'GPS nu disponibil'}`);
      }
      
      // Verificare permisiuni
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({name: 'geolocation'});
          logs.push(`Permisiune Geolocation: ${permission.state}`);
        } catch (permError: any) {
          logs.push(`Eroare verificare permisiuni: ${permError?.message || 'Nu disponibil'}`);
        }
      }
      logs.push('');
      
      // localStorage data
      logs.push('=== DATE SALVATE ===');
      Object.keys(localStorage).forEach(key => {
        if (key.includes('transport') || key.includes('gps') || key.includes('log')) {
          logs.push(`${key}: ${localStorage.getItem(key)}`);
        }
      });
      logs.push('');
      
      // Console logs dacă sunt salvate
      const consoleLogs = localStorage.getItem('console_logs');
      if (consoleLogs) {
        logs.push('=== CONSOLE LOGS ===');
        logs.push(consoleLogs);
      }
      
      // Creează și descarcă fișierul - compatibil cu mobile
      const logContent = logs.join('\n');
      const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
      
      // Pentru dispozitive mobile, folosim o abordare diferită
      if (navigator.share && navigator.canShare && navigator.canShare({ text: logContent })) {
        // Folosim Web Share API pentru mobile
        await navigator.share({
          title: 'iTrack Debug Logs',
          text: logContent,
        });
      } else {
        // Fallback pentru download tradițional
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `itrack-debug-${Date.now()}.txt`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
      
      toast({
        title: "Loguri exportate",
        description: "Fișierul de debug a fost descărcat cu succes.",
        variant: "default",
      });
    } catch (error) {
      console.error("Eroare la exportul logurilor:", error);
      toast({
        title: "Eroare export",
        description: "Nu s-au putut exporta logurile.",
        variant: "destructive",
      });
    }
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
            
            {/* Indicator GPS inactiv cu buton pentru a solicita permisiuni doar când e problema cu permisiunile */}
            {!gpsPermissionsAvailable && (
              <button 
                onClick={handleRequestGpsPermissions}
                disabled={requestingGps}
                className="flex items-center text-xs bg-red-700 text-white px-2 py-0.5 rounded-full mt-0.5 hover:bg-red-600 transition-colors"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                GPS inactiv
              </button>
            )}
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
          {/* Buton export loguri */}
          <button 
            onClick={handleExportLogs}
            className="flex items-center text-white hover:text-blue-200 transition-colors"
            title="Export loguri"
          >
            <Download className="h-4 w-4" />
          </button>
          
          {/* Popup despre aplicație */}
          <div className="flex">
            <div className="relative inline-block">
              <button 
                className="flex items-center text-white hover:text-blue-200 transition-colors"
                onClick={onInfoClick}
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full ${isGpsActive ? "bg-green-500" : "bg-red-500"}`}></div>
          </div>
          
          <button onClick={handleLogout} className="ml-2 bg-blue-800 p-1.5 rounded-full hover:bg-blue-900">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
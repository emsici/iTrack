import { useState, useEffect } from "react";
import { AlertCircle, Wifi, WifiOff, MapPin, Map } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { setupConnectivityListeners, getInternetConnectivity, checkGpsAvailability } from "@/lib/connectivityService";
import { hasOfflineGpsData } from "@/lib/offlineStorage";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { syncOfflineData } from "@/lib/connectivityService";
import { useAuth } from "@/context/AuthContext";
import { useTransport } from "@/context/TransportContext";

export default function ConnectivityAlert() {
  const [isInternetConnected, setIsInternetConnected] = useState<boolean>(getInternetConnectivity());
  const [isGpsAvailable, setIsGpsAvailable] = useState<boolean>(true);
  const [hasOfflineData, setHasOfflineData] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const { toast } = useToast();
  const { token } = useAuth();
  const { transportStatus } = useTransport();

  // Verificăm starea GPS și Internet și configurăm listeners
  useEffect(() => {
    // Verifică GPS-ul la intervale regulate - doar dacă transportul este activ
    const checkGps = async () => {
      // Verificăm starea GPS-ului doar dacă transportul este activ
      if (transportStatus === "active") {
        const gpsStatus = await checkGpsAvailability();
        setIsGpsAvailable(gpsStatus);
      } else {
        // Dacă transportul nu este activ, considerăm GPS-ul disponibil
        // pentru a nu afișa alerte inutile
        setIsGpsAvailable(true);
      }
    };
    
    // Verifică datele offline
    const checkOfflineData = () => {
      setHasOfflineData(hasOfflineGpsData());
    };
    
    // Inițial verificăm statusurile
    checkGps();
    checkOfflineData();
    setIsInternetConnected(getInternetConnectivity());
    
    // Configurăm listener pentru conectivitate internet
    setupConnectivityListeners((isConnected) => {
      setIsInternetConnected(isConnected);
      
      if (isConnected) {
        // Când conexiunea este restabilită, verificăm din nou datele offline
        checkOfflineData();
      }
    });
    
    // Verifică periodic GPS și datele offline
    const intervalId = setInterval(() => {
      checkGps();
      checkOfflineData();
    }, 30000); // 30 secunde
    
    return () => {
      clearInterval(intervalId);
    };
  }, [transportStatus]); // Adăugăm transportStatus ca dependență pentru a reacționa la schimbări
  
  // Adăugăm listener pentru a intercepta evenimentele de notificare de la procesul de sincronizare
  useEffect(() => {
    // Ascultăm mesajele de tip toast de la procesul de sincronizare
    const handleToastMessage = (event: any) => {
      if (event.detail && event.detail.message) {
        toast({
          title: "Sincronizare date",
          description: event.detail.message,
        });
      }
    };
    
    // Adăugăm event listener-ul
    document.addEventListener('toast-message', handleToastMessage);
    
    // Cleanup când componenta este demontată
    return () => {
      document.removeEventListener('toast-message', handleToastMessage);
    };
  }, [toast]);

  // Funcție pentru sincronizarea manuală a datelor
  const handleSyncData = async () => {
    if (!isInternetConnected) {
      toast({
        variant: "destructive",
        title: "Eroare de sincronizare",
        description: "Nu există conexiune la internet. Vă rugăm să vă conectați pentru a sincroniza datele.",
      });
      return;
    }
    
    setIsSyncing(true);
    
    try {
      // Nu mai afișăm direct notificări aici, le interceptăm din evenimentele emise de syncOfflineData
      const success = await syncOfflineData(token || undefined);
      
      // Verificăm din nou starea datelor offline
      setHasOfflineData(hasOfflineGpsData());
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Eroare de sincronizare",
        description: "A apărut o eroare la sincronizarea datelor GPS. Se va încerca din nou automat.",
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Nu afișăm nimic dacă totul este ok
  if (isInternetConnected && isGpsAvailable && !hasOfflineData) {
    return null;
  }
  
  return (
    <div className="space-y-2 mb-4">
      {!isInternetConnected && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center">
            <WifiOff className="h-4 w-4 mr-2" /> Fără conexiune la internet
          </AlertTitle>
          <AlertDescription>
            Conexiunea la internet este întreruptă. Datele GPS sunt salvate local și vor fi trimise automat când conexiunea va fi restabilită.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Afișăm alerta GPS doar când transportul este activ */}
      {!isGpsAvailable && transportStatus === "active" && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200 mt-6">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="flex items-center text-yellow-700">
            <Map className="h-4 w-4 mr-2" /> Locație dezactivată
          </AlertTitle>
          <AlertDescription>
            <p>Serviciul de locație este dezactivat sau aplicația nu are permisiuni. Vă rugăm să:</p>
            
            <ul className="list-disc pl-5 mt-2 text-yellow-700 text-sm">
              <li>Activați <strong>Locația</strong> în meniul de setări rapide al telefonului (glisați în jos din partea de sus a ecranului)</li>
              <li>În setările telefonului, activați permisiunile de locație pentru aplicația iTrack</li>
              <li>Selectați opțiunea <strong>"Permite tot timpul"</strong> pentru locație</li>
              <li>Ieșiți în aer liber pentru un semnal de locație mai bun</li>
            </ul>
            
            <Button 
              onClick={() => window.location.reload()}
              size="sm" 
              variant="outline"
              className="self-start mt-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
            >
              Reîncarcă aplicația
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {hasOfflineData && isInternetConnected && (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle className="flex items-center text-blue-700">
            <MapPin className="h-4 w-4 mr-2" /> Date GPS nesincronizate
          </AlertTitle>
          <AlertDescription className="flex flex-col">
            <span className="mb-2">Există date GPS salvate local care nu au fost trimise către server.</span>
            <Button 
              size="sm" 
              variant="outline"
              className="self-start mt-1 bg-blue-100 hover:bg-blue-200 text-blue-700"
              onClick={handleSyncData}
              disabled={isSyncing}
            >
              {isSyncing ? "Se sincronizează..." : "Sincronizează acum"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

    </div>
  );
}
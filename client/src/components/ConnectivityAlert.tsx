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
    // Verifică GPS-ul la intervale regulate
    const checkGps = async () => {
      const gpsStatus = await checkGpsAvailability();
      setIsGpsAvailable(gpsStatus);
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
  }, []);
  
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
      const success = await syncOfflineData(token || undefined);
      
      if (success) {
        toast({
          title: "Sincronizare reușită",
          description: "Toate datele GPS salvate local au fost sincronizate cu serverul.",
        });
      } else {
        toast({
          title: "Sincronizare parțială",
          description: "Unele date nu au putut fi sincronizate. Se va încerca din nou automat.",
        });
      }
      
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
      
      {!isGpsAvailable && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200 mt-6">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="flex items-center text-yellow-700">
            <Map className="h-4 w-4 mr-2" /> GPS inactiv
          </AlertTitle>
          <AlertDescription>
            <p>GPS-ul este dezactivat sau nu are semnal. {transportStatus === "active" ? "Vă rugăm să:" : ""}</p>
            
            {transportStatus === "active" && (
              <ul className="list-disc pl-5 mt-2 text-yellow-700 text-sm">
                <li>Verificați dacă locația (GPS) este activată în setările telefonului</li>
                <li>Verificați dacă aplicația are permisiunile necesare pentru accesarea locației</li>
                <li>Încercați să ieșiți în aer liber sau aproape de o fereastră pentru semnal GPS mai bun</li>
                <li>Reporniți aplicația dacă problema persistă</li>
              </ul>
            )}
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
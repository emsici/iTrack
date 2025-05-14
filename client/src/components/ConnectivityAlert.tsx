import { useState, useEffect } from "react";
import { AlertCircle, Wifi, WifiOff, MapPin, Map, Database } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { setupConnectivityListeners, getInternetConnectivity, checkGpsAvailability } from "@/lib/connectivityService";
import { hasOfflineGpsData, saveGpsDataOffline, getOfflineGpsData } from "@/lib/offlineStorage";
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
      
      {/* Afișăm alerta GPS doar când transportul este activ */}
      {!isGpsAvailable && transportStatus === "active" && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200 mt-6">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="flex items-center text-yellow-700">
            <Map className="h-4 w-4 mr-2" /> GPS inactiv
          </AlertTitle>
          <AlertDescription>
            <p>GPS-ul este dezactivat sau nu are semnal. Vă rugăm să:</p>
            
            <ul className="list-disc pl-5 mt-2 text-yellow-700 text-sm">
              <li>Verificați dacă locația (GPS) este activată în setările telefonului</li>
              <li>Verificați dacă aplicația are permisiunile necesare pentru accesarea locației</li>
              <li>Încercați să ieșiți în aer liber sau aproape de o fereastră pentru semnal GPS mai bun</li>
              <li>Reporniți aplicația dacă problema persistă</li>
            </ul>
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
      
      {/* Buton de testare pentru duplicate - doar în mediul de dezvoltare */}
      {import.meta.env.DEV && (
        <Alert variant="default" className="bg-purple-50 border-purple-200 mt-4">
          <Database className="h-4 w-4 text-purple-500" />
          <AlertTitle className="text-purple-700">Testare eliminare duplicate GPS</AlertTitle>
          <AlertDescription className="flex flex-col">
            <span className="mb-2">Buton pentru testarea mecanismului de eliminare a datelor GPS duplicate.</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="self-start mt-1 bg-purple-100 hover:bg-purple-200 text-purple-700"
                onClick={() => {
                  // Generăm 10 înregistrări GPS, dintre care 5 sunt duplicate (aceleași coordonate)
                  const lat = 44.25800;
                  const lng = 28.61800;
                  const baseTime = new Date();
                  
                  // Creăm 5 înregistrări unice
                  for (let i = 0; i < 5; i++) {
                    const offset = i * 0.0001; // Modificăm puțin coordonatele
                    const timestamp = new Date(baseTime.getTime() + i * 60000); // Adăugăm minute
                    
                    saveGpsDataOffline({
                      lat: lat + offset,
                      lng: lng + offset,
                      timestamp: timestamp.toISOString().replace('T', ' ').substring(0, 19),
                      viteza: 0,
                      directie: 0,
                      altitudine: 0,
                      baterie: 75,
                      numar_inmatriculare: 'B123XYZ',
                      uit: 'UIT12345',
                      status: 'in_progress',
                      hdop: 5,
                      gsm_signal: 90
                    });
                  }
                  
                  // Acum adăugăm 5 duplicate (aceleași coordonate și timestamp)
                  for (let i = 0; i < 5; i++) {
                    saveGpsDataOffline({
                      lat: lat,
                      lng: lng,
                      timestamp: baseTime.toISOString().replace('T', ' ').substring(0, 19),
                      viteza: 0,
                      directie: 0,
                      altitudine: 0,
                      baterie: 75,
                      numar_inmatriculare: 'B123XYZ',
                      uit: 'UIT12345',
                      status: 'in_progress',
                      hdop: 5,
                      gsm_signal: 90
                    });
                  }
                  
                  // Actualizăm starea
                  setHasOfflineData(hasOfflineGpsData());
                  
                  toast({
                    title: "Date de test generate",
                    description: `Au fost generate 10 înregistrări GPS (5 unice + 5 duplicate). Total actual: ${getOfflineGpsData().length}`,
                  });
                }}
              >
                Generează date de test
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                className="self-start mt-1 bg-green-100 hover:bg-green-200 text-green-700"
                onClick={async () => {
                  if (!isInternetConnected) {
                    toast({
                      variant: "destructive",
                      title: "Eroare",
                      description: "Nu există conexiune la internet.",
                    });
                    return;
                  }
                  
                  setIsSyncing(true);
                  try {
                    const totalBefore = getOfflineGpsData().length;
                    const success = await syncOfflineData(token || undefined);
                    const totalAfter = getOfflineGpsData().length;
                    
                    toast({
                      title: success ? "Sincronizare reușită" : "Sincronizare parțială",
                      description: `Înainte: ${totalBefore}, După: ${totalAfter}, Eliminate: ${totalBefore - totalAfter}`,
                    });
                    
                    // Verificăm din nou starea datelor offline
                    setHasOfflineData(hasOfflineGpsData());
                  } catch (error) {
                    toast({
                      variant: "destructive",
                      title: "Eroare de sincronizare",
                      description: "A apărut o eroare la sincronizarea datelor GPS.",
                    });
                  } finally {
                    setIsSyncing(false);
                  }
                }}
              >
                Testează sincronizarea
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
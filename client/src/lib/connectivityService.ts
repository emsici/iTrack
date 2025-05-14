import { saveGpsDataOffline, getOfflineGpsData, clearOfflineGpsData, removeOfflineGpsRecords } from './offlineStorage';
import { sendGpsData } from './transportService';
import { requestGpsPermissions } from './capacitorService';
import { Http } from '@capacitor-community/http';

// Inițializăm starea de conectivitate
let isInternetConnected = navigator.onLine;
let isGpsAvailable = true;
let isCheckingGps = false;

// Funcția pentru a obține starea actuală a conexiunii la internet
export const getInternetConnectivity = (): boolean => {
  return isInternetConnected;
};

// Funcția pentru a obține starea actuală a GPS-ului
export const getGpsAvailability = (): boolean => {
  return isGpsAvailable;
};

// Funcția care verifică disponibilitatea GPS
export const checkGpsAvailability = async (): Promise<boolean> => {
  // Prevenim verificări multiple simultane
  if (isCheckingGps) {
    return isGpsAvailable;
  }
  
  isCheckingGps = true;
  
  try {
    // Verificăm dacă API-ul de geolocație este disponibil
    if (!('geolocation' in navigator)) {
      console.log("API-ul de geolocație nu este disponibil");
      isGpsAvailable = false;
      isCheckingGps = false;
      return false;
    }
    
    // Încercăm să obținem poziția curentă cu un timeout scurt
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (err) => reject(err),
          { timeout: 5000, maximumAge: 0, enableHighAccuracy: true }
        );
      });
      
      if (position && position.coords) {
        console.log("GPS disponibil, poziție obținută:", {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        isGpsAvailable = true;
        isCheckingGps = false;
        return true;
      } else {
        console.log("Poziție GPS invalidă sau incompletă");
        isGpsAvailable = false;
        isCheckingGps = false;
        return false;
      }
    } catch (gpsError) {
      console.log("Eroare la obținerea poziției GPS:", gpsError);
      
      // Verificăm dacă eroarea indică lipsa permisiunilor și solicităm permisiuni
      const gpsErrorObj = gpsError as GeolocationPositionError;
      if (gpsErrorObj.code === 1) { // 1 = PERMISSION_DENIED
        console.log("Permisiune GPS lipsă, încercăm să solicităm permisiunile");
        try {
          const permissionGranted = await requestGpsPermissions();
          console.log("Rezultatul solicitării permisiunilor:", permissionGranted);
          
          // Verificăm din nou GPS-ul după ce utilizatorul a acordat permisiuni
          if (permissionGranted) {
            try {
              // O nouă încercare de a obține poziția
              const newPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                  (pos) => resolve(pos),
                  (err) => reject(err),
                  { timeout: 5000, maximumAge: 0, enableHighAccuracy: true }
                );
              });
              
              if (newPosition && newPosition.coords) {
                console.log("GPS disponibil după acordarea permisiunilor");
                isGpsAvailable = true;
                isCheckingGps = false;
                return true;
              }
            } catch (retryError) {
              console.log("GPS inaccesibil chiar și după acordarea permisiunilor:", retryError);
            }
          }
        } catch (permissionError) {
          console.error("Eroare la solicitarea permisiunilor GPS:", permissionError);
        }
      }
      
      isGpsAvailable = false;
      isCheckingGps = false;
      return false;
    }
  } catch (error) {
    console.error("Eroare la verificarea GPS:", error);
    isGpsAvailable = false;
    isCheckingGps = false;
    return false;
  }
};

// Setup listeners pentru monitorizarea stării conexiunii la internet
export const setupConnectivityListeners = (
  onConnectivityChange?: (isConnected: boolean) => void
): (() => void) => {
  // Definim funcțiile handler pentru a le putea elimina ulterior
  const handleOnline = () => {
    isInternetConnected = true;
    console.log('Conexiune la internet restabilită');
    
    // Notificăm callback-ul dacă există
    if (onConnectivityChange) {
      onConnectivityChange(true);
    }
    
    // Încercăm să trimitem datele stocate offline
    syncOfflineData();
  };
  
  const handleOffline = () => {
    isInternetConnected = false;
    console.log('Conexiune la internet pierdută');
    
    // Notificăm callback-ul dacă există
    if (onConnectivityChange) {
      onConnectivityChange(false);
    }
  };
  
  // Adăugăm event listeners
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Inițializăm starea
  isInternetConnected = navigator.onLine;
  
  // Returnăm funcția de cleanup pentru a fi apelată când componenta este demontată
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Funcție pentru a sincroniza datele offline când conexiunea la internet este restabilită
export const syncOfflineData = async (token?: string): Promise<boolean> => {
  if (!isInternetConnected) {
    console.log('Nu se pot sincroniza datele offline - nu există conexiune la internet');
    return false;
  }
  
  try {
    // Obținem datele GPS salvate local
    const offlineData = getOfflineData();
    if (offlineData.length === 0) {
      console.log('Nu există date offline pentru sincronizare');
      return true;
    }
    
    console.log(`Sincronizare date offline: ${offlineData.length} înregistrări`);
    
    // Grupăm datele în batch-uri pentru a nu supraîncărca serverul
    const BATCH_SIZE = 5;
    const batches = [];
    
    for (let i = 0; i < offlineData.length; i += BATCH_SIZE) {
      batches.push(offlineData.slice(i, i + BATCH_SIZE));
    }
    
    // Trimitem fiecare batch în serie, nu în paralel, pentru a evita supraîncărcarea serverului
    let failedRecords: Array<any> = [];
    
    for (const batch of batches) {
      // Pentru fiecare înregistrare din batch, încercăm să o trimitem
      const results = await Promise.allSettled(
        batch.map(async (record) => {
          try {
            // Folosim exact același mecanism de trimitere ca în sendGpsData pentru consistență
            const apiExternUrl = "https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php";
            
            // Asigurăm-ne că nu avem valori goale pentru câmpurile importante
            const numar_inmatriculare = String(record.data.numar_inmatriculare || "").trim() || "TEMP-" + Math.floor(Math.random() * 1000);
            const uit_value = String(record.data.uit || "").trim() || "UIT" + Math.floor(Math.random() * 10000);
            
            // Formatăm datele exact cum o face funcția sendGpsData
            const payload = JSON.stringify({
              lat: record.data.lat,
              lng: record.data.lng,
              timestamp: record.data.timestamp,
              viteza: record.data.viteza,
              directie: record.data.directie,
              altitudine: record.data.altitudine,
              baterie: record.data.baterie,
              numar_inmatriculare: numar_inmatriculare,
              uit: uit_value,
              status: record.data.status
            });
            
            console.log("Sincronizare: Trimitere date GPS arhivate către API:", payload);
            
            try {
              const httpResponse = await Http.request({
                method: 'POST',
                url: apiExternUrl,
                headers: {
                  "Authorization": `Bearer ${token || ''}`,
                  "X-Vehicle-Number": numar_inmatriculare,
                  "X-UIT": uit_value
                },
                data: JSON.parse(payload)
              });
              
              console.log("Sincronizare: Status răspuns HTTP GPS:", httpResponse.status);
              
              const responseText = typeof httpResponse.data === 'string' ? httpResponse.data : JSON.stringify(httpResponse.data);
              console.log("Sincronizare: Răspuns API GPS:", responseText);
              
              // Verificăm dacă răspunsul este ok
              if (httpResponse.status < 200 || httpResponse.status >= 300) {
                throw new Error(`API a răspuns cu status: ${httpResponse.status}`);
              }
              
              return { record, success: true };
            } catch (httpError) {
              console.error("Sincronizare: Eroare la request HTTP GPS:", httpError);
              throw httpError;
            }
          } catch (error) {
            console.error("Eroare la sincronizarea înregistrării:", error);
            return { record, success: false };
          }
        })
      );
      
      // Identificăm înregistrările care au fost trimise cu succes
      const successfulRecords = results
        .filter(result => result.status === 'fulfilled' && result.value.success)
        .map(result => (result as PromiseFulfilledResult<{ record: any, success: boolean }>).value.record);
      
      // Identificăm înregistrările care au eșuat
      const failedBatchRecords = results
        .filter(result => result.status === 'rejected' || !(result as any).value.success)
        .map(result => {
          if (result.status === 'rejected') {
            return null; // Nu avem acces la record în cazul respingerii
          }
          return (result as PromiseFulfilledResult<{ record: any, success: boolean }>).value.record;
        })
        .filter(record => record !== null);
      
      // Adăugăm înregistrările eșuate la lista generală
      failedRecords = [...failedRecords, ...failedBatchRecords];
      
      // Ștergem înregistrările sincronizate cu succes
      if (successfulRecords.length > 0) {
        removeOfflineGpsRecords(successfulRecords);
      }
      
      // Adăugăm un delay între batch-uri pentru a nu supraîncărca serverul
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Sincronizare finalizată. Reușite: ${offlineData.length - failedRecords.length}, Eșuate: ${failedRecords.length}`);
    
    return failedRecords.length === 0;
  } catch (error) {
    console.error("Eroare la sincronizarea datelor offline:", error);
    return false;
  }
};

// Define the type for stored GPS records
export interface StoredGpsRecord {
  data: any;
  timestamp: number;
  status: string;
}

// Function to get offline data with proper typing
const getOfflineData = (): StoredGpsRecord[] => {
  return getOfflineGpsData();
};
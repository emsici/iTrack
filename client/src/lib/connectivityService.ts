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

// Flag pentru a controla procesul de sincronizare
let isSyncEnabled = true;

// Funcția pentru a activa/dezactiva sincronizarea 
// Se folosește la logout (dezactivare) și la login (activare)
export const setSyncEnabled = (enabled: boolean): void => {
  isSyncEnabled = enabled;
  console.log(`Sincronizare ${isSyncEnabled ? 'activată' : 'dezactivată'}`);
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
    
    // Încercăm să trimitem datele stocate offline DOAR dacă sincronizarea este activată
    if (isSyncEnabled) {
      console.log('Sincronizare automată activată, începe trimiterea datelor offline');
      syncOfflineData();
    } else {
      console.log('Sincronizare automată dezactivată, datele offline nu se trimit');
    }
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
  
  if (!isSyncEnabled) {
    console.log('Sincronizarea este dezactivată, se ignoră datele offline');
    return false;
  }
  
  try {
    // Obținem datele GPS salvate local
    const offlineData = getOfflineGpsData();
    if (offlineData.length === 0) {
      console.log('Nu există date offline pentru sincronizare');
      return true;
    }
    
    console.log(`Sincronizare date offline: ${offlineData.length} înregistrări`);
    
    // Eliminăm duplicatele înainte de sincronizare
    const uniqueRecords: StoredGpsRecord[] = [];
    const seenEntries = new Set<string>();
    let duplicateCount = 0;
    const duplicateIndices: number[] = []; // Indexurile înregistrărilor duplicate
    
    for (let i = 0; i < offlineData.length; i++) {
      const record = offlineData[i];
      // Creăm un identificator unic pentru această înregistrare bazat pe coordonate și timestamp
      const recordId = `${record.data.lat}-${record.data.lng}-${record.data.timestamp}`;
      
      if (!seenEntries.has(recordId)) {
        seenEntries.add(recordId);
        uniqueRecords.push(record);
      } else {
        console.log('Ignorăm înregistrare duplicată la sincronizare:', recordId);
        duplicateCount++;
        duplicateIndices.push(i); // Salvăm indexul pentru eliminare ulterioară
      }
    }
    
    console.log(`După eliminarea duplicatelor: ${uniqueRecords.length} înregistrări unice, ${duplicateCount} duplicate eliminate`);
    
    // Dacă am găsit duplicate, le eliminăm definitiv din localStorage
    if (duplicateCount > 0) {
      try {
        // Obținem toate datele din localStorage
        const allStoredData = getOfflineGpsData();
        
        // Filtrăm datele pentru a elimina duplicatele
        const cleanedData = allStoredData.filter((_, index) => !duplicateIndices.includes(index));
        
        // Salvăm datele înapoi în localStorage
        localStorage.setItem('itrack_offline_gps_data', JSON.stringify(cleanedData));
        
        console.log(`Am eliminat definitiv ${duplicateCount} duplicate din localStorage.`);
        
        // Adăugăm și o notificare Toast pentru utilizator
        if (window?.document) {
          const event = new CustomEvent('toast-message', { 
            detail: { 
              message: `Sincronizare: ${uniqueRecords.length} înregistrări unice, ${duplicateCount} duplicate eliminate definitiv` 
            } 
          });
          window.document.dispatchEvent(event);
        }
      } catch (e) {
        console.error('Eroare la eliminarea duplicatelor din localStorage:', e);
      }
    }
    
    // Dacă după eliminarea duplicatelor nu mai avem date de sincronizat, terminăm aici
    if (uniqueRecords.length === 0) {
      console.log(`Nu mai există date de sincronizat după eliminarea duplicatelor. Total duplicate eliminate: ${duplicateCount}`);
      
      // Adăugăm o notificare pentru utilizator
      if (window?.document) {
        const event = new CustomEvent('toast-message', { 
          detail: { 
            message: `Sincronizare: 0 înregistrări trimise, ${duplicateCount} duplicate eliminate definitiv` 
          } 
        });
        window.document.dispatchEvent(event);
      }
      
      return true;
    }

    // Grupăm datele în batch-uri pentru a nu supraîncărca serverul
    const BATCH_SIZE = 5;
    const batches = [];
    
    for (let i = 0; i < uniqueRecords.length; i += BATCH_SIZE) {
      batches.push(uniqueRecords.slice(i, i + BATCH_SIZE));
    }
    
    // Trimitem fiecare batch în serie, nu în paralel, pentru a evita supraîncărcarea serverului
    let failedRecords: Array<any> = [];
    let successCount = 0;
    
    for (const batch of batches) {
      // Pentru fiecare înregistrare din batch, încercăm să o trimitem
      const results = await Promise.allSettled(
        batch.map(async (record) => {
          try {
            // Verificăm dacă coordonatele sunt valide (nu sunt 0,0 sau valori invalide)
            if (record.data.lat === 0 && record.data.lng === 0) {
              console.log('Ignorăm înregistrare cu coordonate invalide (0,0)');
              return { record, success: false, reason: 'invalid_coordinates' };
            }
            
            if (isNaN(record.data.lat) || isNaN(record.data.lng)) {
              console.log('Ignorăm înregistrare cu coordonate NaN');
              return { record, success: false, reason: 'invalid_coordinates' };
            }
            
            // Folosim exact același mecanism de trimitere ca în sendGpsData pentru consistență
            const apiExternUrl = "https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php";
            
            // Asigurăm-ne că nu avem valori goale pentru câmpurile importante
            const numar_inmatriculare = String(record.data.numar_inmatriculare || "").trim();
            const uit_value = String(record.data.uit || "").trim();
            
            // Dacă lipsesc informațiile esențiale, ignorăm această înregistrare
            if (!numar_inmatriculare || !uit_value) {
              console.log('Ignorăm înregistrare cu date incomplete:', {
                numar_inmatriculare, 
                uit: uit_value
              });
              return { record, success: false, reason: 'missing_data' };
            }
            
            // Formatăm datele exact cum o face funcția sendGpsData din gpsService.ts
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
              status: record.data.status,
              hdop: record.data.hdop || 5,         // Adăugăm HDOP cu valoare default dacă nu există
              gsm_signal: record.data.gsm_signal || 90  // Adăugăm puterea semnalului GSM cu valoare default
            });
            
            console.log("Sincronizare: Trimitere date GPS arhivate către API:", payload);
            
            try {
              // În browser, folosim proxy-ul pentru a evita problemele CORS
              const apiUrl = "/api/transport/gps";
              // Determinăm dacă suntem în mediul nativ (Android/iOS) sau în browser
              const isNative = false; // Pentru simplitate, dezactivăm modul nativ în browser
              
              if (isNative) {
                // Pentru dispozitive native, folosim HTTP plugin
                const httpResponse = await Http.request({
                  method: 'POST',
                  url: apiExternUrl,
                  headers: {
                    "Authorization": `Bearer ${token || ''}`,
                    "X-Vehicle-Number": numar_inmatriculare,
                    "X-UIT": uit_value,
                    "Content-Type": "application/json"
                  },
                  data: payload
                });
                
                console.log("Sincronizare: Status răspuns Capacitor HTTP (GPS):", httpResponse.status);
                return { record, success: httpResponse.status >= 200 && httpResponse.status < 300 };
              } else {
                // În browser, folosim fetch cu proxy-ul nostru
                const response = await fetch(apiUrl, {
                  method: "POST",
                  headers: {
                    "Authorization": token?.startsWith("Bearer ") ? token : `Bearer ${token || ''}`,
                    "X-Vehicle-Number": numar_inmatriculare,
                    "X-UIT": uit_value,
                    "Content-Type": "application/json"
                  },
                  body: payload
                });
                
                console.log("Sincronizare: Status răspuns HTTP GPS:", response.status);
                
                if (!response.ok) {
                  throw new Error(`API a răspuns cu status: ${response.status}`);
                }
                
                const responseText = await response.text();
                console.log("Sincronizare: Răspuns API GPS:", responseText);
                
                return { record, success: true };
              }
            } catch (httpError) {
              console.error("Sincronizare: Eroare la request HTTP GPS:", httpError);
              return { record, success: false };
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
    
    // Calculăm numărul de înregistrări sincronizate cu succes
    successCount = offlineData.length - failedRecords.length - duplicateCount;
    
    console.log(`Sincronizare finalizată. Reușite: ${successCount}, Eșuate: ${failedRecords.length}, Duplicate eliminate: ${duplicateCount}`);
    
    // Adăugăm o notificare pentru utilizator cu statistici complete
    if (window?.document) {
      const event = new CustomEvent('toast-message', { 
        detail: { 
          message: `Sincronizare completă: ${successCount} transmise, ${failedRecords.length} eșuate, ${duplicateCount} duplicate eliminate` 
        } 
      });
      window.document.dispatchEvent(event);
    }
    
    // Returnam true daca nu exista inregistrari esuate (toate au fost trimise sau eliminate)
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
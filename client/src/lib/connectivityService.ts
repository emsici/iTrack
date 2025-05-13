import { saveGpsDataOffline, getOfflineGpsData, clearOfflineGpsData, removeOfflineGpsRecords } from './offlineStorage';
import { sendGpsData } from './transportService';

// Inițializăm starea de conectivitate
let isInternetConnected = navigator.onLine;
let isGpsAvailable = true;

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
  try {
    // Verificăm dacă API-ul de geolocație este disponibil
    if (!('geolocation' in navigator)) {
      isGpsAvailable = false;
      return false;
    }
    
    // Încercăm să obținem poziția curentă cu un timeout scurt
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (err) => reject(err),
        { timeout: 5000, maximumAge: 0, enableHighAccuracy: true }
      );
    });
    
    if (position) {
      isGpsAvailable = true;
      return true;
    } else {
      isGpsAvailable = false;
      return false;
    }
  } catch (error) {
    console.error("Eroare la verificarea GPS:", error);
    isGpsAvailable = false;
    return false;
  }
};

// Setup listeners pentru monitorizarea stării conexiunii la internet
export const setupConnectivityListeners = (
  onConnectivityChange?: (isConnected: boolean) => void
): (() => void) => {
  // Adăugăm event listeners pentru schimbările de conectivitate
  window.addEventListener('online', () => {
    isInternetConnected = true;
    console.log('Conexiune la internet restabilită');
    
    // Notificăm callback-ul dacă există
    if (onConnectivityChange) {
      onConnectivityChange(true);
    }
    
    // Încercăm să trimitem datele stocate offline
    syncOfflineData();
  });
  
  window.addEventListener('offline', () => {
    isInternetConnected = false;
    console.log('Conexiune la internet pierdută');
    
    // Notificăm callback-ul dacă există
    if (onConnectivityChange) {
      onConnectivityChange(false);
    }
  });
  
  // Inițializăm starea
  isInternetConnected = navigator.onLine;
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
    const BATCH_SIZE = 10;
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
            // Folosim token-ul furnizat sau, dacă nu există, presupunem că există în contextul autentificării
            const success = await sendGpsData(record.data, token || '');
            return { record, success };
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
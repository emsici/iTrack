import { GpsDataPayload } from "./gpsService";

// Cheie pentru stocarea locală a datelor GPS
const OFFLINE_GPS_DATA_KEY = 'itrack_offline_gps_data';

/**
 * Interfață pentru înregistrările stocate local
 * Adăugăm timestamp pentru a putea sorta datele corect
 */
interface StoredGpsRecord {
  data: GpsDataPayload;
  timestamp: number; // Unix timestamp al momentului stocării
  status: string;    // Statusul transportului în momentul înregistrării
}

/**
 * Salvează datele GPS în localStorage când nu există conexiune la internet
 * Verifică dacă există deja o înregistrare cu aceleași coordonate și timestamp înainte de a o adăuga
 */
export const saveGpsDataOffline = (
  data: GpsDataPayload, 
  status: string = "in_progress"
): void => {
  try {
    // Obținem datele existente sau inițializăm un array gol
    const existingData: StoredGpsRecord[] = getOfflineGpsData();
    
    // Verificăm dacă există deja o înregistrare cu aceleași coordonate și timestamp
    const isDuplicate = existingData.some(record => 
      record.data.lat === data.lat && 
      record.data.lng === data.lng && 
      record.data.timestamp === data.timestamp
    );
    
    if (isDuplicate) {
      console.log('[Offline Storage] Date duplicate detectate, nu se salvează:', {
        lat: data.lat, 
        lng: data.lng, 
        timestamp: data.timestamp
      });
      return;
    }
    
    // Adăugăm noua înregistrare
    existingData.push({
      data,
      timestamp: Date.now(),
      status
    });
    
    // Salvăm înapoi în localStorage
    localStorage.setItem(OFFLINE_GPS_DATA_KEY, JSON.stringify(existingData));
    
    console.log(`[Offline Storage] Datele GPS au fost salvate local. Total: ${existingData.length} înregistrări`);
    
  } catch (error) {
    console.error("[Offline Storage] Eroare la salvarea datelor GPS offline:", error);
  }
};

/**
 * Obține toate datele GPS stocate local
 */
export const getOfflineGpsData = (): StoredGpsRecord[] => {
  try {
    const storedData = localStorage.getItem(OFFLINE_GPS_DATA_KEY);
    if (!storedData) return [];
    
    return JSON.parse(storedData) as StoredGpsRecord[];
  } catch (error) {
    console.error("[Offline Storage] Eroare la citirea datelor GPS offline:", error);
    return [];
  }
};

/**
 * Verifică dacă există date GPS stocate local
 */
export const hasOfflineGpsData = (): boolean => {
  return getOfflineGpsData().length > 0;
};

/**
 * Șterge datele GPS offline după ce au fost trimise cu succes
 */
export const clearOfflineGpsData = (): void => {
  try {
    localStorage.removeItem(OFFLINE_GPS_DATA_KEY);
    console.log("[Offline Storage] Datele GPS offline au fost șterse");
  } catch (error) {
    console.error("[Offline Storage] Eroare la ștergerea datelor GPS offline:", error);
  }
};

/**
 * Elimină un set specific de înregistrări (după ce au fost trimise cu succes)
 */
export const removeOfflineGpsRecords = (recordsToRemove: StoredGpsRecord[]): void => {
  try {
    // Obținem toate datele existente
    const allData = getOfflineGpsData();
    if (allData.length === 0) return;
    
    // Creăm o hartă cu timestamp-urile de înregistrări care trebuie eliminate
    const timestampsToRemove = new Set(recordsToRemove.map(r => r.timestamp));
    
    // Filtrăm pentru a păstra doar înregistrările care nu sunt în lista de eliminat
    const remainingData = allData.filter(record => !timestampsToRemove.has(record.timestamp));
    
    // Salvăm datele rămase
    localStorage.setItem(OFFLINE_GPS_DATA_KEY, JSON.stringify(remainingData));
    
    console.log(`[Offline Storage] S-au eliminat ${recordsToRemove.length} înregistrări. Rămase: ${remainingData.length}`);
  } catch (error) {
    console.error("[Offline Storage] Eroare la eliminarea înregistrărilor GPS offline:", error);
  }
};
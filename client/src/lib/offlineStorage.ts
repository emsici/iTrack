import { GpsDataPayload } from "./gpsService";
import { UitOption } from "@/context/TransportContext";

// Chei pentru stocarea locală a datelor
const OFFLINE_GPS_DATA_KEY = 'itrack_offline_gps_data';
const TRANSPORT_STATE_KEY = 'itrack_transport_state';
const ACTIVE_UIT_KEY = 'itrack_active_uit';
const SELECTED_UITS_KEY = 'itrack_selected_uits';

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
    
    // Verificăm dacă există duplicate în datele rămase
    const coordinatesMap = new Map();
    let duplicatesFound = 0;
    
    remainingData.forEach(record => {
      const key = `${record.data.lat}-${record.data.lng}-${record.data.timestamp}`;
      if (coordinatesMap.has(key)) {
        duplicatesFound++;
      } else {
        coordinatesMap.set(key, true);
      }
    });
    
    if (duplicatesFound > 0) {
      console.log(`[Offline Storage] ATENȚIE: Încă există ${duplicatesFound} duplicate în datele rămase!`);
    }
  } catch (error) {
    console.error("[Offline Storage] Eroare la eliminarea înregistrărilor GPS offline:", error);
  }
};

/**
 * Funcții pentru persistența stării transportului între sesiuni
 */

/**
 * Salvează starea transportului în localStorage
 */
export const saveTransportState = (state: string): void => {
  try {
    localStorage.setItem(TRANSPORT_STATE_KEY, state);
    console.log(`[Offline Storage] Starea transportului salvată: ${state}`);
  } catch (error) {
    console.error("[Offline Storage] Eroare la salvarea stării transportului:", error);
  }
};

/**
 * Obține starea transportului din localStorage
 */
export const getTransportState = (): string | null => {
  try {
    return localStorage.getItem(TRANSPORT_STATE_KEY);
  } catch (error) {
    console.error("[Offline Storage] Eroare la citirea stării transportului:", error);
    return null;
  }
};

/**
 * Salvează UIT-ul activ în localStorage
 */
export const saveActiveUit = (uit: UitOption | null): void => {
  try {
    if (uit) {
      localStorage.setItem(ACTIVE_UIT_KEY, JSON.stringify(uit));
      console.log(`[Offline Storage] UIT activ salvat: ${uit.uit}`);
    } else {
      localStorage.removeItem(ACTIVE_UIT_KEY);
      console.log(`[Offline Storage] UIT activ șters`);
    }
  } catch (error) {
    console.error("[Offline Storage] Eroare la salvarea UIT-ului activ:", error);
  }
};

/**
 * Obține UIT-ul activ din localStorage
 */
export const getActiveUit = (): UitOption | null => {
  try {
    const storedUit = localStorage.getItem(ACTIVE_UIT_KEY);
    if (!storedUit) return null;
    
    return JSON.parse(storedUit) as UitOption;
  } catch (error) {
    console.error("[Offline Storage] Eroare la citirea UIT-ului activ:", error);
    return null;
  }
};

/**
 * Salvează lista de UIT-uri selectate în localStorage
 */
export const saveSelectedUits = (uits: UitOption[]): void => {
  try {
    localStorage.setItem(SELECTED_UITS_KEY, JSON.stringify(uits));
    console.log(`[Offline Storage] Lista de UIT-uri salvată, ${uits.length} elemente`);
  } catch (error) {
    console.error("[Offline Storage] Eroare la salvarea listei de UIT-uri:", error);
  }
};

/**
 * Obține lista de UIT-uri selectate din localStorage
 */
export const getSelectedUits = (): UitOption[] => {
  try {
    const storedUits = localStorage.getItem(SELECTED_UITS_KEY);
    if (!storedUits) return [];
    
    return JSON.parse(storedUits) as UitOption[];
  } catch (error) {
    console.error("[Offline Storage] Eroare la citirea listei de UIT-uri:", error);
    return [];
  }
};
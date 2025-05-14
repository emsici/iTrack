import { UitOption } from "@/context/TransportContext";
import { toast } from "@/hooks/use-toast";

// Chei pentru stocarea în localStorage
const TRANSPORT_STATE_KEY = 'itrack_transport_state';
const ACTIVE_UIT_KEY = 'itrack_active_uit';
const SELECTED_UITS_KEY = 'itrack_selected_uits';
const LAST_GPS_UPDATE_KEY = 'itrack_last_gps_update';
const BATTERY_KEY = 'itrack_battery_level';
const SESSION_INITIALIZED_KEY = 'itrack_session_initialized';

// Tipuri de status pentru transport
export type TransportStatus = "inactive" | "active" | "paused" | "finished";

// Interfață pentru toate datele stocate
export interface SavedAppState {
  transportStatus: TransportStatus;
  currentActiveUit: UitOption | null;
  selectedUits: UitOption[];
  lastGpsUpdateTime: string | null;
  battery: number;
  sessionInitialized: boolean;
}

/**
 * Salvează starea aplicației în localStorage
 * Toate datele sunt stocate separat pentru a permite actualizări parțiale
 */
export const saveAppState = (
  transportStatus: TransportStatus,
  currentActiveUit: UitOption | null,
  selectedUits: UitOption[],
  lastGpsUpdateTime: string | null = null,
  battery: number = 100
): void => {
  try {
    // Salvăm starea transportului doar dacă avem un UIT activ sau suntem inactivi
    if (currentActiveUit || transportStatus === "inactive" as TransportStatus) {
      localStorage.setItem(TRANSPORT_STATE_KEY, transportStatus);
      localStorage.setItem(SESSION_INITIALIZED_KEY, 'true');
      
      if (lastGpsUpdateTime) {
        localStorage.setItem(LAST_GPS_UPDATE_KEY, lastGpsUpdateTime);
      }
      
      localStorage.setItem(BATTERY_KEY, battery.toString());
      
      // Salvăm UIT-ul activ
      if (currentActiveUit) {
        localStorage.setItem(ACTIVE_UIT_KEY, JSON.stringify(currentActiveUit));
      } else {
        localStorage.removeItem(ACTIVE_UIT_KEY);
      }
      
      // Salvăm lista de UIT-uri selectate
      if (selectedUits.length > 0) {
        localStorage.setItem(SELECTED_UITS_KEY, JSON.stringify(selectedUits));
      } else {
        localStorage.removeItem(SELECTED_UITS_KEY);
      }
      
      console.log(`[State Manager] Starea aplicației salvată. Transport: ${transportStatus}`);
    } else if (transportStatus === "inactive") {
      // Ștergem starea când suntem inactivi
      clearAppState();
    }
  } catch (error) {
    console.error("[State Manager] Eroare la salvarea stării:", error);
  }
};

/**
 * Obține starea salvată din localStorage
 * Returnează null dacă nu există stare salvată
 */
export const getSavedAppState = (): SavedAppState | null => {
  try {
    // Verificăm dacă există o stare de transport salvată
    const transportStatus = localStorage.getItem(TRANSPORT_STATE_KEY);
    if (!transportStatus) return null;
    
    // Obținem UIT-ul activ
    let currentActiveUit = null;
    const activeUitStr = localStorage.getItem(ACTIVE_UIT_KEY);
    if (activeUitStr) {
      try {
        currentActiveUit = JSON.parse(activeUitStr);
      } catch (error) {
        console.error("[State Manager] Eroare la parsarea UIT-ului activ:", error);
      }
    }
    
    // Obținem lista de UIT-uri selectate
    let selectedUits: UitOption[] = [];
    const selectedUitsStr = localStorage.getItem(SELECTED_UITS_KEY);
    if (selectedUitsStr) {
      try {
        selectedUits = JSON.parse(selectedUitsStr);
      } catch (error) {
        console.error("[State Manager] Eroare la parsarea listei de UIT-uri:", error);
      }
    }
    
    // Obținem timestamp-ul ultimei actualizări GPS
    const lastGpsUpdateTime = localStorage.getItem(LAST_GPS_UPDATE_KEY);
    
    // Obținem nivelul bateriei
    let battery = 100;
    const batteryStr = localStorage.getItem(BATTERY_KEY);
    if (batteryStr) {
      battery = parseInt(batteryStr, 10);
      if (isNaN(battery)) battery = 100;
    }
    
    // Verificăm dacă sesiunea a fost deja inițializată
    const sessionInitialized = localStorage.getItem(SESSION_INITIALIZED_KEY) === 'true';
    
    return {
      transportStatus: transportStatus as TransportStatus,
      currentActiveUit,
      selectedUits,
      lastGpsUpdateTime,
      battery,
      sessionInitialized
    };
  } catch (error) {
    console.error("[State Manager] Eroare la obținerea stării salvate:", error);
    return null;
  }
};

/**
 * Șterge starea salvată din localStorage
 */
export const clearAppState = (): void => {
  try {
    localStorage.removeItem(TRANSPORT_STATE_KEY);
    localStorage.removeItem(ACTIVE_UIT_KEY);
    localStorage.removeItem(SELECTED_UITS_KEY);
    localStorage.removeItem(LAST_GPS_UPDATE_KEY);
    localStorage.removeItem(BATTERY_KEY);
    console.log("[State Manager] Starea aplicației a fost ștearsă");
  } catch (error) {
    console.error("[State Manager] Eroare la ștergerea stării:", error);
  }
};

/**
 * Verifică și restaurează starea aplicației
 * Această funcție ar trebui apelată o singură dată la pornirea aplicației
 */
export const restoreAppState = (
  setTransportStatus: (status: TransportStatus) => void,
  setCurrentActiveUit: (uit: UitOption | null) => void,
  setSelectedUits: (uits: UitOption[]) => void,
  setLastGpsUpdateTime: (time: string | null) => void,
  setBattery: (level: number) => void
): boolean => {
  try {
    // Obținem starea salvată
    const savedState = getSavedAppState();
    if (!savedState) return false;
    
    // Verificăm dacă avem o stare activă
    const hasActiveState = savedState.transportStatus === "active" || savedState.transportStatus === "paused";
    
    // Restaurăm starea doar dacă avem un UIT activ și starea nu este inactivă
    if (hasActiveState && savedState.currentActiveUit) {
      console.log(`[State Manager] Restaurare stare: ${savedState.transportStatus} pentru UIT: ${savedState.currentActiveUit.uit}`);
      
      // Setăm UIT-urile
      if (savedState.selectedUits.length > 0) {
        setSelectedUits(savedState.selectedUits);
      }
      
      // Setăm UIT-ul activ
      setCurrentActiveUit(savedState.currentActiveUit);
      
      // Setăm timestamp-ul ultimei actualizări GPS
      if (savedState.lastGpsUpdateTime) {
        setLastGpsUpdateTime(savedState.lastGpsUpdateTime);
      }
      
      // Setăm nivelul bateriei
      setBattery(savedState.battery);
      
      // Setăm starea transportului la final pentru a declanșa efectele dependente
      setTransportStatus(savedState.transportStatus);
      
      // Notificăm utilizatorul
      setTimeout(() => {
        toast({
          title: "Sesiune restaurată",
          description: `Transport ${savedState.transportStatus} restaurat pentru UIT: ${savedState.currentActiveUit?.uit}`,
        });
      }, 1000);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("[State Manager] Eroare la restaurarea stării:", error);
    return false;
  }
};

/**
 * Verifică dacă ar trebui să pornim tracking-ul GPS automat la restaurare
 * Pornim DOAR dacă transportul este activ (nu în pauză)
 */
export const shouldStartGpsOnRestore = (): boolean => {
  try {
    const savedState = getSavedAppState();
    if (!savedState) return false;
    
    return savedState.transportStatus === "active" && !!savedState.currentActiveUit;
  } catch (error) {
    console.error("[State Manager] Eroare la verificarea stării pentru GPS:", error);
    return false;
  }
};

/**
 * Verifică dacă sesiunea a fost deja inițializată, pentru a evita inițializări multiple
 */
export const isSessionInitialized = (): boolean => {
  return localStorage.getItem(SESSION_INITIALIZED_KEY) === 'true';
};

/**
 * Marchează sesiunea ca inițializată
 */
export const markSessionInitialized = (): void => {
  localStorage.setItem(SESSION_INITIALIZED_KEY, 'true');
};
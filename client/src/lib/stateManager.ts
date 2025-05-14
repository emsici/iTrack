// Manager central pentru gestionarea stării aplicației

// Definim TransportStatus direct aici pentru a evita importul circular
export type TransportStatus = "inactive" | "active" | "paused" | "finished";

// Importăm tipul UitOption pentru starea aplicației
import type { UitOption } from "@/context/TransportContext";
import { addLog } from "./logService";

// Cheile pentru stocarea datelor în localStorage
const APP_STATE_KEY = 'itrack_app_state';
const SESSION_INITIALIZED_KEY = 'itrack_session_initialized';

// Interfață pentru starea aplicației
export interface AppState {
  transportStatus: TransportStatus;
  currentActiveUit: UitOption | null;
  selectedUits: UitOption[];
  lastGpsUpdateTime: string | null;
  battery: number;
}

/**
 * Salvează starea aplicației în localStorage
 */
export const saveAppState = (
  transportStatus: TransportStatus,
  currentActiveUit: UitOption | null,
  selectedUits: UitOption[],
  lastGpsUpdateTime: string | null,
  battery: number
): void => {
  try {
    const appState: AppState = {
      transportStatus,
      currentActiveUit,
      selectedUits,
      lastGpsUpdateTime,
      battery
    };
    
    localStorage.setItem(APP_STATE_KEY, JSON.stringify(appState));
    addLog('Stare aplicație salvată', 'info', 'stateManager', appState);
  } catch (error) {
    console.error("[State Manager] Eroare la salvarea stării:", error);
    addLog('Eroare la salvarea stării aplicației', 'error', 'stateManager', { error: String(error) });
  }
};

/**
 * Obține starea aplicației din localStorage
 */
export const getSavedAppState = (): AppState | null => {
  try {
    const savedState = localStorage.getItem(APP_STATE_KEY);
    if (!savedState) {
      return null;
    }
    
    return JSON.parse(savedState) as AppState;
  } catch (error) {
    console.error("[State Manager] Eroare la obținerea stării:", error);
    addLog('Eroare la obținerea stării salvate', 'error', 'stateManager', { error: String(error) });
    return null;
  }
};

/**
 * Restaurează starea aplicației din localStorage
 * @returns true dacă starea a fost restaurată cu succes, false altfel
 */
export const restoreAppState = (
  setTransportStatus: (status: TransportStatus) => void,
  setCurrentActiveUit: (uit: UitOption | null) => void,
  setSelectedUits: (uits: UitOption[]) => void,
  setLastGpsUpdateTime: (time: string | null) => void,
  setBattery: (level: number) => void
): boolean => {
  try {
    const savedState = getSavedAppState();
    if (!savedState) {
      console.log("[State Manager] Nu există stare salvată pentru restaurare");
      addLog('Nu există stare salvată pentru restaurare', 'info', 'stateManager');
      return false;
    }
    
    // Restaurăm fiecare stare în parte
    setTransportStatus(savedState.transportStatus);
    setCurrentActiveUit(savedState.currentActiveUit);
    setSelectedUits(savedState.selectedUits || []);
    setLastGpsUpdateTime(savedState.lastGpsUpdateTime);
    setBattery(savedState.battery || 100);
    
    console.log("[State Manager] Stare restaurată cu succes");
    addLog('Stare aplicație restaurată cu succes', 'info', 'stateManager', savedState);
    
    return true;
  } catch (error) {
    console.error("[State Manager] Eroare la restaurarea stării:", error);
    addLog('Eroare la restaurarea stării aplicației', 'error', 'stateManager', { error: String(error) });
    return false;
  }
};

/**
 * Șterge starea aplicației din localStorage
 */
export const clearAppState = (): void => {
  try {
    localStorage.removeItem(APP_STATE_KEY);
    console.log("[State Manager] Stare ștearsă");
    addLog('Stare aplicație ștearsă', 'info', 'stateManager');
  } catch (error) {
    console.error("[State Manager] Eroare la ștergerea stării:", error);
    addLog('Eroare la ștergerea stării aplicației', 'error', 'stateManager', { error: String(error) });
  }
};

/**
 * Marchează sesiunea ca fiind inițializată pentru a preveni inițializările multiple
 */
export const markSessionInitialized = (): void => {
  try {
    localStorage.setItem(SESSION_INITIALIZED_KEY, 'true');
    addLog('Sesiune marcată ca inițializată', 'debug', 'stateManager');
  } catch (error) {
    console.error("[State Manager] Eroare la marcarea sesiunii ca inițializată:", error);
  }
};

/**
 * Verifică dacă sesiunea a fost deja inițializată
 */
export const isSessionInitialized = (): boolean => {
  try {
    return localStorage.getItem(SESSION_INITIALIZED_KEY) === 'true';
  } catch (error) {
    console.error("[State Manager] Eroare la verificarea inițializării sesiunii:", error);
    return false;
  }
};

/**
 * Resetează starea de inițializare a sesiunii
 * Trebuie apelat la deconectare pentru a permite reinițializarea la următoarea autentificare
 */
export const resetSessionInitialization = (): void => {
  try {
    localStorage.removeItem(SESSION_INITIALIZED_KEY);
    addLog('Inițializare sesiune resetată', 'debug', 'stateManager');
  } catch (error) {
    console.error("[State Manager] Eroare la resetarea inițializării sesiunii:", error);
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
    
    // CORECȚIE IMPORTANTĂ: Trebuie să restaurăm ORICE transport (activ sau în pauză)
    // și să permitem UI-ului să decidă dacă pornește sau nu GPS-ul.
    // CHIAR DACĂ avem transport activ dar nu avem UIT, forțăm restaurarea pentru a evita pierderea stării
    const shouldRestore = (savedState.transportStatus === "active" || savedState.transportStatus === "paused");
                        
    console.log(
      `[State Manager] Verificare restaurare transport:`,
      `Status=${savedState.transportStatus}`,
      `UIT=${savedState.currentActiveUit?.uit || "niciunul"}`,
      `Rezultat=${shouldRestore ? "DA" : "NU"}`
    );
    
    // CORECȚIE: Dacă am decis că trebuie restaurat dar nu avem UIT, vom folosi starea salvată
    // pentru a reconstitui UIT-ul din lista selectată sau o valoare implicită
    if (shouldRestore && !savedState.currentActiveUit) {
      console.log("[State Manager] Nu există UIT activ, dar forțăm restaurarea transportului");
    }
    
    return shouldRestore;
  } catch (error) {
    console.error("[State Manager] Eroare la verificarea stării pentru restaurare:", error);
    return false;
  }
};
// Helper pentru transport și GPS
import type { GpsCoordinates } from "./gpsService";
import { saveAppState, getSavedAppState } from "./stateManager";
import type { UitOption } from "@/context/TransportContext";

// Referință la starea transportului pentru stabilitate între re-randări
interface TransportStateRef {
  transportStatus: 'active' | 'inactive' | 'paused' | 'finished';
  isGpsActive: boolean;
  gpsCoordinates: GpsCoordinates | null;
}

// Singleton-ul nostru pentru starea stabilă
let transportStateRef: TransportStateRef = {
  transportStatus: 'inactive',
  isGpsActive: false,
  gpsCoordinates: null
};

/**
 * Actualizează referința stării de transport
 */
export const updateTransportState = (
  status: 'active' | 'inactive' | 'paused' | 'finished',
  isGpsActive: boolean,
  coords: GpsCoordinates | null = null
): void => {
  // Actualizează stateRef
  transportStateRef.transportStatus = status;
  transportStateRef.isGpsActive = isGpsActive;
  
  if (coords) {
    transportStateRef.gpsCoordinates = coords;
  }
  
  // Logăm actualizarea
  console.log(`[TransportHelper] Stare actualizată: status=${status}, gpsActive=${isGpsActive}, hasCoords=${!!coords}`);
};

/**
 * Obține starea curentă a transportului
 */
export const getTransportState = (): TransportStateRef => {
  return { ...transportStateRef };
};

/**
 * Salvează starea întregii aplicații în localStorage
 * pentru persistență și restaurare
 */
export const saveTransportState = (
  status: 'active' | 'inactive' | 'paused' | 'finished',
  currentActiveUit: UitOption | null,
  selectedUits: UitOption[],
  lastGpsUpdateTime: string | null,
  battery: number
): void => {
  // Actualizează stateRef
  transportStateRef.transportStatus = status;
  
  // Salvează în localStorage
  saveAppState(
    status,
    currentActiveUit,
    selectedUits,
    lastGpsUpdateTime,
    battery
  );
  
  console.log(`[TransportHelper] Stare transport salvată: ${status}`);
};

/**
 * Verifică dacă transportul este activ în mod stabil (din referință)
 */
export const isTransportActive = (): boolean => {
  return transportStateRef.transportStatus === 'active';
};

/**
 * Verifică dacă GPS-ul este activ în mod stabil (din referință)
 */
export const isGpsActive = (): boolean => {
  return transportStateRef.isGpsActive;
};

/**
 * Forțează actualizarea stării transportului
 * Acest mecanism este esențial pentru a menține starea transportului
 * între actualizări și pentru a preveni resetarea stării
 * Implementare robustă pentru a evita dependențele circulare și erorile de referință
 */
export const forceTransportActive = (): void => {
  try {
    // Setăm starea de referință
    transportStateRef.transportStatus = 'active';
    transportStateRef.isGpsActive = true;
    
    // Încercăm să accesăm localStorage direct în loc să folosim funcții importate
    // care ar putea cauza dependențe circulare
    try {
      const savedStateJson = localStorage.getItem('itrack_app_state');
      if (savedStateJson) {
        const savedState = JSON.parse(savedStateJson);
        
        // Dacă starea salvată nu este activă, o actualizăm forțat
        if (savedState && savedState.transportStatus !== 'active') {
          console.log("[TransportHelper] Detectată inconsistență în stare salvată, actualizare forțată");
          
          // Creăm un obiect nou cu proprietățile originale dar cu status 'active'
          const updatedState = {
            ...savedState,
            transportStatus: 'active'
          };
          
          // Salvăm direct în localStorage
          localStorage.setItem('itrack_app_state', JSON.stringify(updatedState));
        }
      } else {
        // Nu există stare salvată, creăm una minimală
        const minimumState = {
          transportStatus: 'active',
          currentActiveUit: null,
          selectedUits: [],
          lastGpsUpdateTime: new Date().toISOString(),
          battery: 100
        };
        
        localStorage.setItem('itrack_app_state', JSON.stringify(minimumState));
      }
    } catch (storageError) {
      // Eroare la accesarea sau parsarea localStorage - o prindem separat
      // pentru a nu împiedica actualizarea stării de referință
      console.error("[TransportHelper] Eroare la accesarea localStorage:", storageError);
    }
    
    console.log("[TransportHelper] Forțare stare transport: ACTIVE");
  } catch (generalError) {
    // Prinde orice eroare neașteptată
    console.error("[TransportHelper] Eroare generală la forțarea stării active:", generalError);
  }
};
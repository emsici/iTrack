// Helper pentru transport și GPS
import type { GpsCoordinates } from "./gpsService";
import { saveAppState } from "./stateManager";
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
 */
export const forceTransportActive = (): void => {
  transportStateRef.transportStatus = 'active';
  transportStateRef.isGpsActive = true;
  console.log("[TransportHelper] Forțare stare transport: ACTIVE");
};
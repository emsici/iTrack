import { Capacitor } from '@capacitor/core';
import { CapacitorGeoService } from './capacitorService';
import { sendGpsUpdate } from './gpsService';

// Stare globală pentru serviciul de background
let isBackgroundServiceRunning = false;
let backgroundTaskId: number | null = null;

// Interval în milisecunde pentru actualizările GPS în background
const BACKGROUND_UPDATE_INTERVAL = 60000; // 1 minut

/**
 * Inițializează serviciul de background pentru monitorizarea locației
 * Această funcție trebuie apelată când utilizatorul pornește transportul
 */
export const startBackgroundLocationTracking = async (
  vehicleInfo: { nr: string; uit: string },
  token: string
): Promise<boolean> => {
  // Dacă serviciul rulează deja, nu-l pornim din nou
  if (isBackgroundServiceRunning) {
    console.log('Serviciul de background rulează deja');
    return true;
  }

  try {
    // Verificăm dacă rulăm pe o platformă nativă
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      // Solicităm permisiunile necesare pentru locație în background
      await CapacitorGeoService.requestPermissions();
      
      // Pentru dispozitive native, folosim Capacitor pentru a rula în background
      backgroundTaskId = window.setInterval(async () => {
        try {
          // Obținem poziția curentă
          const position = await CapacitorGeoService.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
          
          // Trimitem poziția către server cu status "active"
          await sendGpsUpdate(position, vehicleInfo, token, "active");
          
          console.log('Background GPS update trimis cu succes');
        } catch (error) {
          console.error('Eroare la trimiterea actualizării GPS din background:', error);
        }
      }, BACKGROUND_UPDATE_INTERVAL);
      
      isBackgroundServiceRunning = true;
      
      console.log('Serviciu de background pornit cu succes');
      return true;
    } else {
      // Pe web, folosim API-ul de tracking în prim-plan
      console.log('Background tracking nu este disponibil pe web, se folosește tracking în prim-plan');
      return false;
    }
  } catch (error) {
    console.error('Eroare la pornirea serviciului de background:', error);
    return false;
  }
};

/**
 * Oprește serviciul de background
 * Această funcție trebuie apelată când utilizatorul oprește sau finalizează transportul
 */
export const stopBackgroundLocationTracking = (): boolean => {
  try {
    if (backgroundTaskId !== null) {
      clearInterval(backgroundTaskId);
      backgroundTaskId = null;
    }
    
    isBackgroundServiceRunning = false;
    console.log('Serviciul de background a fost oprit');
    return true;
  } catch (error) {
    console.error('Eroare la oprirea serviciului de background:', error);
    return false;
  }
};

/**
 * Verifică dacă serviciul de background rulează
 */
export const isBackgroundServiceActive = (): boolean => {
  return isBackgroundServiceRunning;
};
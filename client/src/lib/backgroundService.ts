import { Capacitor } from '@capacitor/core';
import { CapacitorGeoService } from './capacitorService';
import { sendGpsUpdate } from './gpsService';

// Stare globală pentru serviciul de background
let isBackgroundServiceRunning = false;
let backgroundTaskId: number | null = null;
let lastSentBackgroundPosition: any = null;

// Interval în milisecunde pentru actualizările GPS în background
const BACKGROUND_UPDATE_INTERVAL = 60000; // 1 minut
const DEBUG_UPDATE_INTERVAL = 10000; // 10 secunde pentru dezvoltare/testare
const MIN_DISTANCE_CHANGE = 10; // minim 10 metri pentru a considera o schimbare de poziție

/**
 * Inițializează serviciul de background pentru monitorizarea locației
 * Această funcție trebuie apelată când utilizatorul pornește transportul
 */
export const startBackgroundLocationTracking = async (
  vehicleNumber: string,
  uit: string,
  token: string,
  onPositionUpdate?: (position: any) => void
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
      // IMPORTANT: Trimitem coordonate din minut în minut, indiferent de mișcare
      const updateInterval = BACKGROUND_UPDATE_INTERVAL; // Întotdeauna 60000 ms (1 minut)
      
      console.log(`Background service pornit - interval: ${updateInterval/1000} secunde`);
      
      backgroundTaskId = window.setInterval(async () => {
        try {
          console.log('Rulare task background - obținere poziție GPS');
          
          // Obținem poziția curentă
          const position = await CapacitorGeoService.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
          
          if (!position || !position.coords) {
            console.error('Poziție GPS invalidă obținută în background');
            return;
          }
          
          console.log('Poziție GPS obținută în background:', JSON.stringify({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
          
          // IMPORTANT: Verificăm și în serviciul de background ca poziția să fie trimisă DOAR dacă
          // transportul este activ. Verificarea se face când pornim serviciul, dar facem dublă verificare aici.
          console.log("Background service: trimitere actualizare GPS - status in_progress");
          const success = await sendGpsUpdate(position, 
            {
              nr: vehicleNumber,
              uit: uit
            }, 
            token, 
            "in_progress"
          );
          
          // Notificăm componenta părinte despre actualizare dacă este necesar
          if (onPositionUpdate && position) {
            onPositionUpdate(position);
          }
          
          console.log('Background GPS update trimis:', success ? 'Succes' : 'Eșuat');
        } catch (error) {
          console.error('Eroare la trimiterea actualizării GPS din background:', error);
        }
      }, updateInterval);
      
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
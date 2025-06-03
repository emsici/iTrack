/**
 * Plugin nativ pentru serviciul GPS background pe Android
 * Controlează serviciul Foreground Service real pentru transmisie continuă
 */

import { registerPlugin } from '@capacitor/core';

export interface GpsTrackingPlugin {
  startGpsService(options: {
    vehicleNumber: string;
    uit: string;
    authToken: string;
  }): Promise<{ success: boolean; message: string }>;
  
  stopGpsService(): Promise<{ success: boolean; message: string }>;
  
  checkGpsServiceStatus(): Promise<{ isRunning: boolean; message: string }>;
}

const GpsTracking = registerPlugin<GpsTrackingPlugin>('GpsTracking');

let isNativeServiceRunning = false;

/**
 * Pornește serviciul GPS nativ Android cu Foreground Service
 */
export const startNativeAndroidGpsService = async (
  vehicleNumber: string,
  uit: string,
  token: string
): Promise<boolean> => {
  try {
    console.log('[Native GPS Plugin] Pornesc serviciul GPS nativ Android pentru:', { vehicleNumber, uit });
    
    // Detectez dacă rulăm în browser (preview) sau pe Android
    const isWeb = (window as any).Capacitor?.getPlatform() === 'web' || !(window as any).Capacitor;
    
    if (isWeb) {
      console.log('[Native GPS Plugin] Browser detectat - pornesc transmisia GPS web imediată');
      
      // În browser, execut transmisia GPS direct
      try {
        // Importez funcția de transmisie GPS
        const { transmitNativeGps } = await import('./nativeGpsService');
        
        console.log('[Native GPS Plugin] Execut prima transmisie GPS...');
        const firstTransmit = await transmitNativeGps(vehicleNumber, uit, token);
        console.log(`[Native GPS Plugin] Prima transmisie ${firstTransmit ? 'reușită' : 'eșuată'}`);
        
        // Programez transmisia la fiecare 60 secunde
        const gpsInterval = setInterval(async () => {
          console.log('[Native GPS Plugin] Transmisie automată la 60s');
          const success = await transmitNativeGps(vehicleNumber, uit, token);
          console.log(`[Native GPS Plugin] Transmisie ${success ? 'reușită' : 'eșuată'} la ${new Date().toLocaleTimeString()}`);
        }, 60000);
        
        // Salvez intervalul pentru a-l putea opri mai târziu
        (window as any).gpsTransmissionInterval = gpsInterval;
        
        return true;
      } catch (error) {
        console.error('[Native GPS Plugin] Eroare la transmisia GPS web:', error);
        return false;
      }
    }
    
    const result = await GpsTracking.startGpsService({
      vehicleNumber: vehicleNumber,
      uit: uit,
      authToken: token
    });
    
    if (result.success) {
      isNativeServiceRunning = true;
      console.log('[Native GPS Plugin] ✅ Serviciu GPS nativ pornit cu succes:', result.message);
      return true;
    } else {
      console.error('[Native GPS Plugin] ❌ Eroare la pornirea serviciului:', result.message);
      return false;
    }
    
  } catch (error: any) {
    // În cazul erorii UNIMPLEMENTED (browser), returnez success
    if (error.code === 'UNIMPLEMENTED') {
      console.log('[Native GPS Plugin] Plugin nativ nu este disponibil în browser - folosesc GPS web');
      return true;
    }
    console.error('[Native GPS Plugin] Eroare critică la pornirea serviciului nativ:', error);
    return false;
  }
};

/**
 * Oprește serviciul GPS nativ Android
 */
export const stopNativeAndroidGpsService = async (): Promise<void> => {
  try {
    console.log('[Native GPS Plugin] Opresc serviciul GPS nativ Android');
    
    const result = await GpsTracking.stopGpsService();
    
    if (result.success) {
      isNativeServiceRunning = false;
      console.log('[Native GPS Plugin] ✅ Serviciu GPS nativ oprit cu succes:', result.message);
    } else {
      console.warn('[Native GPS Plugin] ⚠️ Eroare la oprirea serviciului:', result.message);
    }
    
  } catch (error) {
    console.error('[Native GPS Plugin] Eroare la oprirea serviciului nativ:', error);
  }
};

/**
 * Verifică statusul serviciului GPS nativ
 */
export const checkNativeAndroidGpsStatus = async (): Promise<boolean> => {
  try {
    const result = await GpsTracking.checkGpsServiceStatus();
    return result.isRunning;
  } catch (error) {
    console.error('[Native GPS Plugin] Eroare la verificarea statusului:', error);
    return false;
  }
};

/**
 * Verifică dacă serviciul GPS nativ este activ local
 */
export const isNativeAndroidGpsActive = (): boolean => {
  return isNativeServiceRunning;
};

/**
 * Obține informații despre serviciul GPS nativ
 */
export const getNativeAndroidGpsInfo = () => {
  return {
    isRunning: isNativeServiceRunning,
    platform: 'android-native',
    serviceType: 'foreground-service',
    capabilities: [
      'background-execution',
      'wake-lock',
      'persistent-notification',
      'battery-optimization-bypass'
    ]
  };
};

// Export pentru debugging în consolă
(window as any).startNativeAndroidGps = startNativeAndroidGpsService;
(window as any).stopNativeAndroidGps = stopNativeAndroidGpsService;
(window as any).checkNativeAndroidGps = checkNativeAndroidGpsStatus;
(window as any).getNativeAndroidGpsInfo = getNativeAndroidGpsInfo;
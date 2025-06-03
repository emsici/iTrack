/**
 * Serviciu GPS background optimizat pentru transmisie continuă
 * Combină Web Workers cu wake locks și notificări pentru menținerea activă
 */

import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Geolocation } from '@capacitor/geolocation';

let gpsWorker: Worker | null = null;
let wakeLock: any = null;
let heartbeatInterval: number | null = null;
let isServiceActive = false;
let lastGpsTransmission: Date | null = null;

interface GpsWorkerConfig {
  vehicleNumber: string;
  uit: string;
  token: string;
}

/**
 * Obține un wake lock pentru a preveni dormirea dispozitivului
 */
const acquireWakeLock = async (): Promise<boolean> => {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await (navigator as any).wakeLock.request('screen');
      console.log('[Background GPS] Wake lock obținut pentru menținerea activă');
      
      wakeLock.addEventListener('release', () => {
        console.log('[Background GPS] Wake lock eliberat');
      });
      
      return true;
    } else {
      console.warn('[Background GPS] Wake Lock API nu este suportat');
      return false;
    }
  } catch (error) {
    console.error('[Background GPS] Eroare la obținerea wake lock:', error);
    return false;
  }
};

/**
 * Eliberează wake lock-ul
 */
const releaseWakeLock = async (): Promise<void> => {
  try {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
      console.log('[Background GPS] Wake lock eliberat manual');
    }
  } catch (error) {
    console.error('[Background GPS] Eroare la eliberarea wake lock:', error);
  }
};

/**
 * Citește coordonatele GPS cu optimizări pentru baterie
 */
const getOptimizedGpsPosition = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Pe dispozitive native folosește setări optimizate
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 30000 // Cache pentru 30 secunde
      });
      
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        speed: (position.coords.speed || 0) * 3.6, // m/s -> km/h
        heading: position.coords.heading || 0,
        altitude: position.coords.altitude || 0,
        accuracy: position.coords.accuracy || 0,
        timestamp: new Date()
      };
    } else {
      // Browser - cu timeout mai mic
      return new Promise<any>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation indisponibil"));
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              speed: (position.coords.speed || 0) * 3.6,
              heading: position.coords.heading || 0,
              altitude: position.coords.altitude || 0,
              accuracy: position.coords.accuracy || 0,
              timestamp: new Date()
            });
          },
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 30000
          }
        );
      });
    }
  } catch (error) {
    console.error('[Background GPS] Eroare citire coordonate:', error);
    throw error;
  }
};

/**
 * Obține nivelul real al bateriei
 */
const getBatteryLevel = async (): Promise<number> => {
  try {
    if (Capacitor.isNativePlatform()) {
      const batteryInfo = await Device.getBatteryInfo();
      return Math.round((batteryInfo.batteryLevel || 1) * 100);
    } else {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      }
      return 100;
    }
  } catch (error) {
    console.warn('[Background GPS] Eroare citire baterie:', error);
    return 100;
  }
};

/**
 * Transmite datele GPS direct către API
 */
const transmitGpsDirectly = async (config: GpsWorkerConfig): Promise<boolean> => {
  try {
    const coords = await getOptimizedGpsPosition();
    const battery = await getBatteryLevel();
    
    const payload = {
      lat: coords.lat,
      lng: coords.lng,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      viteza: Math.round(coords.speed),
      directie: Math.round(coords.heading),
      altitudine: Math.round(coords.altitude),
      baterie: battery,
      numar_inmatriculare: config.vehicleNumber,
      uit: config.uit,
      status: 2, // transport activ
      hdop: Math.min(Math.round(coords.accuracy / 5), 10),
      gsm_signal: 85
    };
    
    console.log('[Background GPS] Transmit coordonate:', {
      lat: payload.lat.toFixed(6),
      lng: payload.lng.toFixed(6),
      speed: payload.viteza,
      battery: payload.baterie,
      time: new Date().toLocaleTimeString()
    });
    
    let response;
    
    if (Capacitor.isNativePlatform()) {
      // Pe platforma nativă folosește CapacitorHttp
      const { CapacitorHttp } = await import('@capacitor/core');
      
      const httpResponse = await CapacitorHttp.request({
        url: 'https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.token}`
        },
        data: payload
      });
      
      response = {
        ok: httpResponse.status >= 200 && httpResponse.status < 300,
        status: httpResponse.status
      };
    } else {
      // În browser prin fetch
      const fetchResponse = await fetch('https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.token}`,
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(payload)
      });
      
      response = {
        ok: fetchResponse.ok,
        status: fetchResponse.status
      };
    }
    
    if (response.ok) {
      lastGpsTransmission = new Date();
      console.log(`[Background GPS] ✅ Transmisie reușită: ${response.status}`);
      return true;
    } else {
      console.error(`[Background GPS] ❌ Eroare transmisie: ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.error('[Background GPS] Eroare critică transmisie:', error);
    return false;
  }
};

/**
 * Pornește heartbeat pentru menținerea activă
 */
const startHeartbeat = () => {
  // Heartbeat la fiecare 30 secunde pentru a menține aplicația activă
  heartbeatInterval = window.setInterval(() => {
    if (isServiceActive) {
      console.log('[Background GPS] ❤️ Heartbeat - mențin aplicația activă');
      
      // Verifică dacă documentul este vizibil
      if (document.visibilityState === 'hidden') {
        console.log('[Background GPS] Aplicația este în background dar heartbeat activ');
      }
      
      // Re-obține wake lock dacă s-a pierdut
      if (!wakeLock || wakeLock.released) {
        acquireWakeLock().catch(console.warn);
      }
    }
  }, 30000);
};

/**
 * Oprește heartbeat-ul
 */
const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('[Background GPS] Heartbeat oprit');
  }
};

/**
 * Pornește serviciul GPS background
 */
export const startBackgroundGpsWorker = async (
  vehicleNumber: string,
  uit: string,
  token: string
): Promise<boolean> => {
  try {
    if (isServiceActive) {
      console.log('[Background GPS] Serviciul este deja activ');
      return true;
    }
    
    console.log('[Background GPS] Pornesc serviciul GPS background pentru:', { vehicleNumber, uit });
    
    const config: GpsWorkerConfig = { vehicleNumber, uit, token };
    
    // Verifică permisiunile GPS
    if (Capacitor.isNativePlatform()) {
      const permissions = await Geolocation.checkPermissions();
      if (permissions.location !== 'granted') {
        const requestResult = await Geolocation.requestPermissions();
        if (requestResult.location !== 'granted') {
          throw new Error('Permisiuni GPS refuzate');
        }
      }
    }
    
    // Obține wake lock pentru a menține aplicația activă
    await acquireWakeLock();
    
    // Pornește heartbeat
    startHeartbeat();
    
    isServiceActive = true;
    
    // Prima transmisie imediată
    console.log('[Background GPS] Prima transmisie GPS...');
    await transmitGpsDirectly(config);
    
    // Programează transmisia la fiecare 60 secunde
    const gpsInterval = setInterval(async () => {
      if (isServiceActive) {
        console.log('[Background GPS] 🕐 Transmisie automată GPS');
        await transmitGpsDirectly(config);
      } else {
        clearInterval(gpsInterval);
      }
    }, 60000);
    
    console.log('[Background GPS] ✅ Serviciu pornit cu succes - transmisie la 60s');
    
    return true;
    
  } catch (error) {
    console.error('[Background GPS] Eroare la pornirea serviciului:', error);
    isServiceActive = false;
    return false;
  }
};

/**
 * Oprește serviciul GPS background
 */
export const stopBackgroundGpsWorker = async (): Promise<void> => {
  try {
    console.log('[Background GPS] Opresc serviciul GPS background');
    
    isServiceActive = false;
    stopHeartbeat();
    await releaseWakeLock();
    
    if (gpsWorker) {
      gpsWorker.terminate();
      gpsWorker = null;
    }
    
    lastGpsTransmission = null;
    
    console.log('[Background GPS] ✅ Serviciu oprit cu succes');
    
  } catch (error) {
    console.error('[Background GPS] Eroare la oprirea serviciului:', error);
  }
};

/**
 * Verifică starea serviciului
 */
export const isBackgroundGpsWorkerActive = (): boolean => {
  return isServiceActive;
};

/**
 * Obține informații despre serviciu
 */
export const getBackgroundGpsWorkerInfo = () => {
  return {
    isActive: isServiceActive,
    hasWakeLock: wakeLock && !wakeLock.released,
    lastTransmission: lastGpsTransmission,
    heartbeatActive: heartbeatInterval !== null,
    platform: Capacitor.isNativePlatform() ? 'native' : 'web'
  };
};

// Export pentru debugging în consolă
(window as any).startBgGps = startBackgroundGpsWorker;
(window as any).stopBgGps = stopBackgroundGpsWorker;
(window as any).checkBgGps = isBackgroundGpsWorkerActive;
(window as any).getBgGpsInfo = getBackgroundGpsWorkerInfo;
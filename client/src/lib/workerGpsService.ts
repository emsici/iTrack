/**
 * Serviciu GPS care folosește Web Workers și Service Workers
 * pentru transmisie continuă chiar și cu aplicația în background
 */

import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Geolocation } from '@capacitor/geolocation';

let gpsWorker: Worker | null = null;
let isWorkerActive = false;
let lastGpsData: any = null;

/**
 * Obține nivelul real al bateriei din dispozitiv
 */
const getRealBatteryLevel = async (): Promise<number> => {
  try {
    if (Capacitor.isNativePlatform()) {
      const batteryInfo = await Device.getBatteryInfo();
      return Math.round((batteryInfo.batteryLevel || 1) * 100);
    } else {
      // Browser - încearcă Battery API
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      }
      return 100;
    }
  } catch (error) {
    console.warn("[Worker GPS] Nu s-a putut citi bateria:", error);
    return 100;
  }
};

/**
 * Citește coordonatele GPS cu precizie maximă
 */
const getCurrentGpsPosition = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      });
      
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        speed: (position.coords.speed || 0) * 3.6, // m/s -> km/h
        heading: position.coords.heading || 0,
        altitude: position.coords.altitude || 0,
        accuracy: position.coords.accuracy || 0
      };
    } else {
      // Browser fallback
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
              accuracy: position.coords.accuracy || 0
            });
          },
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 5000
          }
        );
      });
    }
  } catch (error) {
    console.error("[Worker GPS] Eroare citire GPS:", error);
    throw error;
  }
};

/**
 * Răspunde la cererile GPS de la Worker
 */
const handleWorkerMessage = async (event: MessageEvent) => {
  const { type, requestId } = event.data;
  
  switch (type) {
    case 'GPS_REQUEST':
      try {
        console.log("[Worker GPS] Worker cere coordonate GPS");
        
        const coords = await getCurrentGpsPosition();
        const battery = await getRealBatteryLevel();
        
        const gpsData = {
          ...coords,
          battery: battery,
          timestamp: new Date().toISOString()
        };
        
        lastGpsData = gpsData;
        
        // Trimite coordonatele înapoi la Worker
        gpsWorker?.postMessage({
          type: 'GPS_RESPONSE',
          requestId: requestId,
          gpsData: gpsData
        });
        
        console.log("[Worker GPS] Coordonate trimise către Worker:", {
          lat: gpsData.lat,
          lng: gpsData.lng,
          speed: gpsData.speed,
          battery: gpsData.battery
        });
        
      } catch (error) {
        console.error("[Worker GPS] Eroare la citirea GPS pentru Worker:", error);
        
        gpsWorker?.postMessage({
          type: 'GPS_RESPONSE',
          requestId: requestId,
          gpsData: null
        });
      }
      break;
      
    case 'GPS_STARTED':
      console.log("[Worker GPS] Worker GPS a pornit cu succes");
      break;
      
    case 'GPS_STOPPED':
      console.log("[Worker GPS] Worker GPS s-a oprit");
      break;
      
    case 'GPS_TRANSMITTED':
      const { success, data, error } = event.data;
      if (success) {
        console.log("[Worker GPS] ✅ Transmisie GPS reușită prin Worker");
      } else {
        console.error("[Worker GPS] ❌ Eroare transmisie GPS prin Worker:", error);
      }
      break;
      
    case 'PONG':
      console.log("[Worker GPS] Worker răspunde la ping");
      break;
  }
};

/**
 * Pornește serviciul GPS Worker
 */
export const startWorkerGpsService = async (
  vehicleNumber: string,
  uit: string,
  token: string
): Promise<boolean> => {
  try {
    if (isWorkerActive) {
      console.log("[Worker GPS] Serviciul este deja activ");
      return true;
    }
    
    console.log("[Worker GPS] Pornesc Worker GPS pentru:", { vehicleNumber, uit });
    
    // Verifică dacă browser-ul suportă Workers
    if (typeof Worker === 'undefined') {
      console.error("[Worker GPS] Browser-ul nu suportă Web Workers");
      return false;
    }
    
    // Creează Worker-ul
    try {
      gpsWorker = new Worker('/gps-worker.js');
    } catch (error) {
      console.error("[Worker GPS] Nu s-a putut crea Worker-ul:", error);
      return false;
    }
    
    // Ascultă mesajele de la Worker
    gpsWorker.addEventListener('message', handleWorkerMessage);
    
    // Gestionează erorile Worker-ului
    gpsWorker.addEventListener('error', (error) => {
      console.error("[Worker GPS] Eroare Worker:", error);
    });
    
    // Verifică permisiunile GPS
    if (Capacitor.isNativePlatform()) {
      try {
        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== 'granted') {
          const requestResult = await Geolocation.requestPermissions();
          if (requestResult.location !== 'granted') {
            throw new Error("Permisiuni GPS refuzate");
          }
        }
      } catch (error) {
        console.error("[Worker GPS] Eroare permisiuni GPS:", error);
        return false;
      }
    }
    
    // Pornește Worker-ul cu configurația
    gpsWorker.postMessage({
      type: 'START_GPS',
      config: {
        vehicleNumber: vehicleNumber,
        uit: uit,
        token: token
      }
    });
    
    isWorkerActive = true;
    
    console.log("[Worker GPS] ✅ Serviciu Worker GPS pornit cu succes");
    
    // Încearcă să mențină aplicația activă prin notificări
    if ('serviceWorker' in navigator) {
      try {
        await requestNotificationPermission();
      } catch (error) {
        console.warn("[Worker GPS] Nu s-au putut obține permisiuni pentru notificări:", error);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error("[Worker GPS] Eroare la pornirea serviciului:", error);
    isWorkerActive = false;
    return false;
  }
};

/**
 * Oprește serviciul GPS Worker
 */
export const stopWorkerGpsService = async (): Promise<void> => {
  try {
    console.log("[Worker GPS] Opresc serviciul Worker GPS");
    
    if (gpsWorker) {
      gpsWorker.postMessage({ type: 'STOP_GPS' });
      gpsWorker.removeEventListener('message', handleWorkerMessage);
      gpsWorker.terminate();
      gpsWorker = null;
    }
    
    isWorkerActive = false;
    lastGpsData = null;
    
    console.log("[Worker GPS] ✅ Serviciu Worker GPS oprit");
    
  } catch (error) {
    console.error("[Worker GPS] Eroare la oprirea serviciului:", error);
  }
};

/**
 * Verifică dacă serviciul Worker GPS este activ
 */
export const isWorkerGpsServiceActive = (): boolean => {
  return isWorkerActive && gpsWorker !== null;
};

/**
 * Obține informații despre serviciul Worker GPS
 */
export const getWorkerGpsServiceInfo = () => {
  return {
    isActive: isWorkerActive,
    hasWorker: gpsWorker !== null,
    lastGpsData: lastGpsData,
    platform: Capacitor.isNativePlatform() ? 'native' : 'web'
  };
};

/**
 * Cere permisiuni pentru notificări (pentru a menține aplicația activă)
 */
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log("[Worker GPS] Permisiuni notificări:", permission);
      
      if (permission === 'granted') {
        // Trimite o notificare de test pentru a activa serviciul
        new Notification('iTrack GPS', {
          body: 'Serviciul GPS este activ în background',
          icon: '/favicon.ico',
          silent: true,
          tag: 'gps-active'
        });
      }
    }
  }
};

/**
 * Test ping către Worker
 */
export const pingWorker = () => {
  if (gpsWorker) {
    gpsWorker.postMessage({ type: 'PING' });
  }
};

// Export pentru debugging în consolă
(window as any).startWorkerGps = startWorkerGpsService;
(window as any).stopWorkerGps = stopWorkerGpsService;
(window as any).checkWorkerGps = isWorkerGpsServiceActive;
(window as any).pingWorker = pingWorker;
(window as any).getWorkerGpsInfo = getWorkerGpsServiceInfo;
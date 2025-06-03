/**
 * Serviciu GPS pentru background - folosește strategii multiple pentru a menține
 * transmisia GPS chiar și când aplicația este minimizată sau telefonul blocat
 */

import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

let backgroundGpsInterval: number | null = null;
let foregroundGpsInterval: number | null = null;
let isServiceActive = false;
let appIsInBackground = false;

interface BackgroundGpsData {
  lat: number;
  lng: number;
  timestamp: string;
  viteza: number;
  directie: number;
  altitudine: number;
  baterie: number;
  numar_inmatriculare: string;
  uit: string;
  status: number;
  hdop: number;
  gsm_signal: number;
}

/**
 * Obține nivelul bateriei dispozitivului
 */
const getBatteryLevel = async (): Promise<number> => {
  try {
    const batteryInfo = await Device.getBatteryInfo();
    return Math.round((batteryInfo.batteryLevel || 1) * 100);
  } catch (error) {
    console.warn("Nu s-a putut citi nivelul bateriei:", error);
    return 100;
  }
};

/**
 * Citește poziția GPS curentă
 */
const getCurrentPosition = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000
      });
      
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        speed: (position.coords.speed || 0) * 3.6, // m/s -> km/h
        heading: position.coords.heading || 0,
        altitude: position.coords.altitude || 0
      };
    } catch (error) {
      console.warn("Capacitor Geolocation failed:", error);
      throw error;
    }
  } else {
    // Browser fallback
    return new Promise<any>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation nu este disponibil"));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            speed: (position.coords.speed || 0) * 3.6,
            heading: position.coords.heading || 0,
            altitude: position.coords.altitude || 0
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
};

/**
 * Transmite coordonatele GPS către server
 */
const transmitGpsData = async (vehicleNumber: string, uit: string, token: string) => {
  try {
    console.log(`[Background GPS] Transmit GPS pentru ${uit} la ${new Date().toLocaleTimeString()}`);
    
    const coords = await getCurrentPosition();
    const batteryLevel = await getBatteryLevel();
    
    const payload: BackgroundGpsData = {
      lat: coords.lat,
      lng: coords.lng,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      viteza: coords.speed,
      directie: coords.heading,
      altitudine: coords.altitude,
      baterie: batteryLevel,
      numar_inmatriculare: vehicleNumber,
      uit: uit,
      status: 2, // active
      hdop: 2,
      gsm_signal: 85
    };
    
    console.log("[Background GPS] Date GPS:", payload);
    
    // Transmite către server
    let response;
    
    if (Capacitor.isNativePlatform()) {
      const { CapacitorHttp } = await import('@capacitor/core');
      
      const httpResponse = await CapacitorHttp.request({
        url: 'https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: payload
      });
      
      response = {
        ok: httpResponse.status >= 200 && httpResponse.status < 300,
        status: httpResponse.status
      };
    } else {
      response = await fetch("/api/gps/transmit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    }
    
    if (response.ok) {
      console.log(`[Background GPS] ✅ Transmisie reușită la ${new Date().toLocaleTimeString()}`);
    } else {
      console.error(`[Background GPS] ❌ Eroare transmisie: ${response.status}`);
    }
    
  } catch (error) {
    console.error("[Background GPS] Eroare la transmisia GPS:", error);
  }
};

/**
 * Pornește serviciul GPS background
 */
export const startBackgroundGpsService = async (vehicleNumber: string, uit: string, token: string) => {
  if (isServiceActive) {
    console.log("[Background GPS] Serviciul este deja activ");
    return;
  }
  
  console.log("[Background GPS] Pornesc serviciul GPS background");
  isServiceActive = true;
  
  // Monitorizează starea aplicației
  if (Capacitor.isNativePlatform()) {
    App.addListener('appStateChange', ({ isActive }) => {
      appIsInBackground = !isActive;
      console.log(`[Background GPS] App state changed: ${isActive ? 'foreground' : 'background'}`);
      
      if (isActive && appIsInBackground) {
        // Aplicația a revenit în foreground
        setupForegroundMode(vehicleNumber, uit, token);
      } else if (!isActive) {
        // Aplicația a trecut în background
        setupBackgroundMode(vehicleNumber, uit, token);
      }
    });
  }
  
  // Pornește în modul foreground inițial
  setupForegroundMode(vehicleNumber, uit, token);
};

/**
 * Configurează transmisia pentru modul foreground
 */
const setupForegroundMode = (vehicleNumber: string, uit: string, token: string) => {
  console.log("[Background GPS] Configurez modul foreground");
  
  // Oprește intervalul background dacă există
  if (backgroundGpsInterval) {
    clearInterval(backgroundGpsInterval);
    backgroundGpsInterval = null;
  }
  
  // Prima transmisie imediat
  transmitGpsData(vehicleNumber, uit, token);
  
  // Interval normal de 60 secunde pentru foreground
  foregroundGpsInterval = window.setInterval(() => {
    if (isServiceActive) {
      transmitGpsData(vehicleNumber, uit, token);
    }
  }, 60000);
};

/**
 * Configurează transmisia pentru modul background
 */
const setupBackgroundMode = (vehicleNumber: string, uit: string, token: string) => {
  console.log("[Background GPS] Configurez modul background");
  
  // Oprește intervalul foreground
  if (foregroundGpsInterval) {
    clearInterval(foregroundGpsInterval);
    foregroundGpsInterval = null;
  }
  
  // Interval mai frecvent pentru background (30 secunde) pentru a compensa suspendarea
  backgroundGpsInterval = window.setInterval(() => {
    if (isServiceActive) {
      console.log("[Background GPS] Transmisie background");
      transmitGpsData(vehicleNumber, uit, token);
    }
  }, 30000);
  
  // Transmisie imediată când intră în background
  transmitGpsData(vehicleNumber, uit, token);
};

/**
 * Oprește serviciul GPS background
 */
export const stopBackgroundGpsService = () => {
  console.log("[Background GPS] Opresc serviciul GPS background");
  
  isServiceActive = false;
  
  if (foregroundGpsInterval) {
    clearInterval(foregroundGpsInterval);
    foregroundGpsInterval = null;
  }
  
  if (backgroundGpsInterval) {
    clearInterval(backgroundGpsInterval);
    backgroundGpsInterval = null;
  }
  
  // Eliminăm listener-ul pentru starea aplicației
  if (Capacitor.isNativePlatform()) {
    App.removeAllListeners();
  }
};

/**
 * Verifică dacă serviciul GPS background rulează
 */
export const isBackgroundGpsActive = () => {
  return isServiceActive;
};

// Export pentru debugging
(window as any).startBackgroundGps = startBackgroundGpsService;
(window as any).stopBackgroundGps = stopBackgroundGpsService;
(window as any).checkBackgroundGps = isBackgroundGpsActive;
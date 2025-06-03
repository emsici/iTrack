/**
 * Serviciu pentru citirea nivelului real al bateriei
 */

import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

/**
 * Obține nivelul real al bateriei din dispozitiv
 */
export const getRealBatteryLevel = async (): Promise<number> => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Pe platforma nativă folosește Capacitor Device API
      const batteryInfo = await Device.getBatteryInfo();
      const batteryLevel = Math.round((batteryInfo.batteryLevel || 1) * 100);
      
      console.log("[Battery] Nivel baterie de pe dispozitiv:", {
        level: batteryLevel,
        isCharging: batteryInfo.isCharging
      });
      
      return batteryLevel;
    } else {
      // În browser încearcă Battery API
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        const batteryLevel = Math.round(battery.level * 100);
        
        console.log("[Battery] Nivel baterie din browser:", {
          level: batteryLevel,
          charging: battery.charging
        });
        
        return batteryLevel;
      } else {
        console.warn("[Battery] Battery API nu este disponibil în acest browser");
        return 100; // Fallback pentru browsere care nu suportă Battery API
      }
    }
  } catch (error) {
    console.error("[Battery] Eroare la citirea bateriei:", error);
    return 100; // Fallback în caz de eroare
  }
};

/**
 * Monitorizează schimbările nivelului bateriei
 */
export const monitorBatteryLevel = (callback: (level: number) => void) => {
  let intervalId: number;
  
  if (Capacitor.isNativePlatform()) {
    // Pe platforma nativă verifică la fiecare 30 secunde
    intervalId = window.setInterval(async () => {
      const level = await getRealBatteryLevel();
      callback(level);
    }, 30000);
  } else {
    // În browser folosește Battery API cu event listeners dacă sunt disponibili
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          const level = Math.round(battery.level * 100);
          callback(level);
        };
        
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
        
        // Verificare inițială
        updateBattery();
      }).catch(() => {
        // Fallback cu verificare periodică
        intervalId = window.setInterval(async () => {
          const level = await getRealBatteryLevel();
          callback(level);
        }, 60000);
      });
    } else {
      // Fallback cu verificare periodică pentru browsere mai vechi
      intervalId = window.setInterval(async () => {
        const level = await getRealBatteryLevel();
        callback(level);
      }, 60000);
    }
  }
  
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
};

// Export pentru debugging în consolă
(window as any).getBatteryLevel = getRealBatteryLevel;
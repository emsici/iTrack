import { Capacitor } from '@capacitor/core';
import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';

// Verifică dacă aplicația rulează pe o platformă nativă (Android/iOS) sau în browser
export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();

// Serviciu de geolocation folosind Capacitor
export const CapacitorGeoService = {
  // Obținerea nivelului bateriei
  getBatteryLevel: async (): Promise<number> => {
    try {
      // Folosim API-ul Browser Battery dacă e disponibil
      if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
        const batteryManager = await (navigator as any).getBattery();
        return Math.round(batteryManager.level * 100);
      }
      // Verificăm API-uri mai vechi
      else if ((navigator as any).battery || (navigator as any).mozBattery) {
        const battery = (navigator as any).battery || (navigator as any).mozBattery;
        return Math.round(battery.level * 100);
      }
      
      // Pe iOS/Android, trebuie făcute verificări speciale pentru dispozitivul real
      if (Capacitor.isNativePlatform()) {
        // În versiunea viitoare se poate adăuga un plugin dedicat pentru baterie
        return 100;
      }

      // Valoare implicită
      return 100;
    } catch (error) {
      console.warn('Nu se poate obține nivelul bateriei:', error);
      return 100; // Valoare implicită
    }
  },
  // Cererea de permisiuni pentru locație
  requestPermissions: async () => {
    if (!isNativePlatform()) {
      return navigator.permissions.query({ name: 'geolocation' });
    }
    
    return await Geolocation.requestPermissions();
  },
  
  // Obținerea poziției curente
  getCurrentPosition: async (options?: PositionOptions): Promise<Position> => {
    if (!isNativePlatform()) {
      // Folosim navigatorul browser pentru web
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const position: Position = {
              coords: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                altitude: pos.coords.altitude,
                altitudeAccuracy: pos.coords.altitudeAccuracy,
                heading: pos.coords.heading,
                speed: pos.coords.speed
              },
              timestamp: pos.timestamp
            };
            resolve(position);
          },
          (error) => reject(error),
          {
            enableHighAccuracy: options?.enableHighAccuracy || true,
            timeout: options?.timeout || 10000,
            maximumAge: options?.maximumAge || 0
          }
        );
      });
    }
    
    // Folosim Capacitor pentru platforme native
    return await Geolocation.getCurrentPosition(options);
  },
  
  // Urmărirea poziției (watch)
  watchPosition: (callback: (position: Position) => void, options?: PositionOptions) => {
    if (!isNativePlatform()) {
      // Folosim navigatorul browser pentru web
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const position: Position = {
            coords: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude,
              altitudeAccuracy: pos.coords.altitudeAccuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed
            },
            timestamp: pos.timestamp
          };
          callback(position);
        },
        (error) => console.error('Eroare la watchPosition:', error),
        {
          enableHighAccuracy: options?.enableHighAccuracy || true,
          timeout: options?.timeout || 10000,
          maximumAge: options?.maximumAge || 0
        }
      );
      
      return {
        watchId,
        clearWatch: () => navigator.geolocation.clearWatch(watchId)
      };
    }
    
    // Folosim Capacitor pentru platforme native
    const startWatch = async () => {
      const watchId = await Geolocation.watchPosition(options || {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }, (position) => {
        if (position) {
          callback(position);
        }
      });
      return {
        watchId,
        clearWatch: () => Geolocation.clearWatch({ id: watchId })
      };
    };
    
    return startWatch();
  }
};

// Functie pentru convertirea obiectelor de poziție
export const convertGeolocationPosition = (position: GeolocationPosition): Position => {
  return {
    coords: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || null,
      altitudeAccuracy: position.coords.altitudeAccuracy || null,
      heading: position.coords.heading || null,
      speed: position.coords.speed || null
    },
    timestamp: position.timestamp
  };
};
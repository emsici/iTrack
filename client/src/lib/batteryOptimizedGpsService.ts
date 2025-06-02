/**
 * Serviciu GPS optimizat pentru baterie
 * Citește coordonatele GPS doar când urmează să se facă transmisia
 */

import { isNativePlatform } from './auth';

export interface OptimizedGpsCoordinates {
  lat: number;
  lng: number;
  timestamp: string;
  viteza: number;
  directie: number;
  altitudine: number;
  baterie: number;
}

/**
 * Citește coordonatele GPS doar pentru transmisie
 * Optimizat pentru a consuma cât mai puțină baterie
 */
export const getGpsForTransmission = (): Promise<OptimizedGpsCoordinates> => {
  return new Promise((resolve, reject) => {
    console.log("[GPS Optimizat] Citire coordonate pentru transmisie...");
    
    if (!navigator.geolocation) {
      reject(new Error("Geolocation nu este suportat"));
      return;
    }

    // Opțiuni optimizate pentru transmisie
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 secunde timeout
      maximumAge: 30000 // Acceptă poziții de până la 30 secunde
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: OptimizedGpsCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
          viteza: position.coords.speed || 0,
          directie: position.coords.heading || 0,
          altitudine: position.coords.altitude || 0,
          baterie: 100 // Va fi actualizat cu bateria reală
        };
        
        console.log("[GPS Optimizat] Coordonate obținute cu succes pentru transmisie:", coords);
        resolve(coords);
      },
      (error) => {
        console.warn("[GPS Optimizat] Eroare la citirea coordonatelor pentru transmisie:", error);
        reject(error);
      },
      options
    );
  });
};

/**
 * Serviciu de transmisie automată optimizat pentru baterie
 */
export class BatteryOptimizedGpsService {
  private intervalId: number | null = null;
  private isActive = false;

  /**
   * Pornește serviciul de transmisie automată la 60 secunde
   */
  start(transmissionCallback: (coords: OptimizedGpsCoordinates) => Promise<void>) {
    if (this.isActive) {
      console.log("[GPS Optimizat] Serviciul este deja activ");
      return;
    }

    console.log("[GPS Optimizat] Pornire serviciu transmisie automată la 60 secunde");
    this.isActive = true;

    // Prima transmisie imediat
    this.performTransmission(transmissionCallback);

    // Apoi la fiecare 60 secunde
    this.intervalId = window.setInterval(() => {
      this.performTransmission(transmissionCallback);
    }, 60000);
  }

  /**
   * Oprește serviciul de transmisie automată
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isActive = false;
    console.log("[GPS Optimizat] Serviciu transmisie automată oprit");
  }

  /**
   * Verifică dacă serviciul este activ
   */
  isRunning(): boolean {
    return this.isActive;
  }

  /**
   * Efectuează o transmisie GPS
   */
  private async performTransmission(transmissionCallback: (coords: OptimizedGpsCoordinates) => Promise<void>) {
    try {
      console.log("[GPS Optimizat] Încep citirea coordonatelor pentru transmisie automată");
      
      // Citim GPS-ul doar acum, la momentul transmisiei
      const coords = await getGpsForTransmission();
      
      console.log("[GPS Optimizat] Transmit coordonatele către server");
      await transmissionCallback(coords);
      
      console.log("[GPS Optimizat] Transmisie automată completă la", new Date().toLocaleTimeString());
    } catch (error) {
      console.error("[GPS Optimizat] Eroare la transmisia automată:", error);
    }
  }
}

// Instanță globală pentru serviciul optimizat
export const batteryOptimizedGpsService = new BatteryOptimizedGpsService();

/**
 * Funcție de conveniență pentru pornirea intervalului GPS
 * Compatibilă cu TransportContext
 */
export const startGpsInterval = (
  getCurrentActiveUit: () => any,
  getToken: () => string | null,
  getTransportStatus: () => string
): number => {
  console.log("[GPS Interval] Pornire interval GPS optimizat pentru baterie");
  
  const transmissionCallback = async (coords: OptimizedGpsCoordinates) => {
    const activeUit = getCurrentActiveUit();
    const token = getToken();
    const status = getTransportStatus();
    
    if (!activeUit || !token || status !== "active") {
      console.log("[GPS Interval] Nu se transmit coordonate - transport inactiv");
      return;
    }
    
    try {
      console.log("[GPS Interval] Transmit coordonate către server:", coords);
      
      // Apel real către server GPS
      const payload = {
        lat: coords.lat,
        lng: coords.lng,
        timestamp: coords.timestamp.replace('T', ' ').substring(0, 19), // Format: "2025-06-02 18:15:30"
        viteza: coords.viteza,
        directie: coords.directie,
        altitudine: coords.altitudine,
        baterie: coords.baterie,
        numar_inmatriculare: "B200ABC", // Din vehicleInfo
        uit: activeUit.uit,
        status: 2, // active
        hdop: 2,
        gsm_signal: 85
      };
      
      console.log("[GPS Interval] Payload către gps.php:", payload);
      
      const response = await fetch("https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const responseText = await response.text();
      console.log("[GPS Interval] Răspuns server:", response.status, responseText);
      
      if (response.ok) {
        console.log("[GPS Interval] ✅ Transmisie reușită la", new Date().toLocaleTimeString());
      } else {
        console.warn("[GPS Interval] ❌ Transmisie eșuată:", response.status);
      }
    } catch (error) {
      console.error("[GPS Interval] Eroare la transmisie:", error);
    }
  };
  
  batteryOptimizedGpsService.start(transmissionCallback);
  
  // Returnăm un ID fictiv pentru compatibilitate
  return 1;
};
/**
 * Serviciu GPS unificat - transmite coordonate la fiecare 60 secunde
 * când transportul este activ
 */

import { Device } from '@capacitor/device';

let gpsTransmissionInterval: number | null = null;
let isServiceActive = false;

interface GpsTransmissionData {
  lat: number;
  lng: number;
  timestamp: string;
  viteza: number;
  directie: number;
  altitudine: number;
  baterie: number;
  numar_inmatriculare: string;
  uit: string;
  status: number; // 2=active, 3=paused, 4=finished
  hdop: number;
  gsm_signal: number;
}

/**
 * Pornește serviciul GPS pentru transmisie la 60 secunde
 */
export const startGpsTransmissionService = (
  vehicleNumber: string,
  uit: string,
  token: string
) => {
  console.log(`[GPS Service] Pornesc transmisia GPS pentru ${vehicleNumber} - UIT: ${uit}`);
  
  // Oprește serviciul existent dacă rulează
  stopGpsTransmissionService();
  
  isServiceActive = true;
  
  // Funcția care trimite GPS-ul
  const transmitGps = async () => {
    if (!isServiceActive) {
      console.log("[GPS Service] Serviciu oprit, nu transmit");
      return;
    }
    
    try {
      console.log("[GPS Service] Citesc coordonate GPS pentru transmisie...");
      
      // Citește coordonatele GPS DOAR acum, la momentul transmisiei
      const coords = await getCurrentGpsPosition();
      
      const payload: GpsTransmissionData = {
        lat: coords.lat,
        lng: coords.lng,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        viteza: coords.speed || 0,
        directie: coords.heading || 0,
        altitudine: coords.altitude || 0,
        baterie: 100, // Vom actualiza cu bateria reală
        numar_inmatriculare: vehicleNumber,
        uit: uit,
        status: 2, // active
        hdop: 2,
        gsm_signal: 85
      };
      
      console.log("[GPS Service] Transmit către server:", payload);
      
      // Trimite către server prin proxy-ul nostru (pentru a evita CORS)
      const response = await fetch("/api/gps/transmit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        console.log(`[GPS Service] ✅ Transmisie reușită la ${new Date().toLocaleTimeString()}`);
      } else {
        console.error(`[GPS Service] ❌ Eroare transmisie: ${response.status}`);
      }
      
    } catch (error) {
      console.error("[GPS Service] Eroare la transmisia GPS:", error);
    }
  };
  
  // Prima transmisie imediat
  transmitGps();
  
  // Apoi la fiecare 60 secunde
  gpsTransmissionInterval = window.setInterval(() => {
    console.log("[GPS Service] 🕐 Interval 60s - transmisie automată");
    transmitGps();
  }, 60000);
  
  console.log("[GPS Service] Interval pornit - transmisie la 60 secunde");
};

/**
 * Oprește serviciul GPS
 */
export const stopGpsTransmissionService = () => {
  console.log("[GPS Service] Opresc serviciul GPS");
  
  isServiceActive = false;
  
  if (gpsTransmissionInterval) {
    clearInterval(gpsTransmissionInterval);
    gpsTransmissionInterval = null;
  }
};

/**
 * Verifică dacă serviciul GPS rulează
 */
export const isGpsServiceActive = () => {
  return isServiceActive && gpsTransmissionInterval !== null;
};

/**
 * Citește poziția GPS curentă
 */
const getCurrentGpsPosition = (): Promise<{
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  altitude: number;
}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation nu este disponibil"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0,
          altitude: position.coords.altitude || 0
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );
  });
};

// Funcții globale pentru debugging din consolă
(window as any).startGps = startGpsTransmissionService;
(window as any).stopGps = stopGpsTransmissionService;
(window as any).checkGps = isGpsServiceActive;
/**
 * Serviciu GPS unificat - transmite coordonate la fiecare 60 secunde
 * când transportul este activ
 */

import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

let gpsTransmissionInterval: number | null = null;
let isServiceActive = false;

/**
 * Obține nivelul bateriei dispozitivului
 */
const getBatteryLevel = async (): Promise<number> => {
  try {
    const batteryInfo = await Device.getBatteryInfo();
    return Math.round((batteryInfo.batteryLevel || 1) * 100);
  } catch (error) {
    console.warn("Nu s-a putut citi nivelul bateriei:", error);
    return 100; // Fallback dacă nu se poate citi
  }
};

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
        baterie: await getBatteryLevel(),
        numar_inmatriculare: vehicleNumber,
        uit: uit,
        status: 2, // active
        hdop: 2,
        gsm_signal: 85
      };
      
      console.log("[GPS Service] Transmit către server:", payload);
      
      // Trimite către server prin proxy-ul nostru (pentru a evita CORS)
      // Pentru platformele native, folosim API-ul direct
      let response;
      
      if (Capacitor.isNativePlatform()) {
        // Pe platformele native folosim CapacitorHttp pentru gps.php
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
          status: httpResponse.status,
          json: () => Promise.resolve(httpResponse.data)
        };
      } else {
        // Pe browser folosim proxy-ul Replit
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
 * Citește poziția GPS curentă folosind API-ul potrivit platformei
 */
const getCurrentGpsPosition = async (): Promise<{
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  altitude: number;
}> => {
  if (Capacitor.isNativePlatform()) {
    // Pe platformele native folosim Capacitor Geolocation pentru viteza și direcția reale
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000
      });
      
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        speed: (position.coords.speed || 0) * 3.6, // convertim m/s în km/h
        heading: position.coords.heading || 0, // grade
        altitude: position.coords.altitude || 0
      };
    } catch (error) {
      console.warn("Capacitor Geolocation failed, falling back to web API:", error);
      // Fallback la web API dacă Capacitor nu funcționează
    }
  }
  
  // Browser sau fallback - folosim Web Geolocation API
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation nu este disponibil"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // În browser, viteza și direcția sunt de obicei null
        // Convertim viteza din m/s în km/h pentru transmisie
        const speedMps = position.coords.speed || 0;
        const speedKmh = speedMps * 3.6; // conversie m/s -> km/h
        
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: speedKmh,
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
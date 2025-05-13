import { GpsDataPayload } from "@shared/schema";
import { apiRequest } from "./queryClient";

export const sendGpsData = async (data: GpsDataPayload, token: string) => {
  try {
    console.log("Trimitere date GPS către API:", JSON.stringify(data, null, 2));
    
    // În mediul de dezvoltare, vom folosi API-ul proxy local
    // În producție, vom folosi API-ul direct
    const apiUrl = import.meta.env.DEV 
      ? "/api/transport/gps" 
      : "https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php";
    
    console.log("Folosim API URL:", apiUrl);
    
    // IMPORTANT: Formatăm datele exact ca în curl (fără whitespace, fără Content-Type)
    const payload = JSON.stringify({
      lat: data.lat,
      lng: data.lng,
      timestamp: data.timestamp,
      viteza: data.viteza,
      directie: data.directie,
      altitudine: data.altitudine,
      baterie: data.baterie,
      numar_inmatriculare: data.numar_inmatriculare,
      uit: data.uit,
      status: data.status
    });
    
    console.log("EXACT PAYLOAD CURL FORMAT:", payload);
    
    // VALIDAT: Acest format funcționează cu API-ul extern (testat cu curl)
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
        // IMPORTANT: Nu setăm Content-Type header exact ca în testul curl reușit
      },
      body: payload // Trimitem payload-ul formatat JSON.stringify
    });

    // Verificăm dacă răspunsul este ok
    if (!response.ok) {
      throw new Error(`API a răspuns cu status: ${response.status}`);
    }

    // Verificăm răspunsul
    const responseText = await response.text();
    console.log("Răspuns API GPS:", responseText);
    
    // În mediul de dezvoltare, acceptăm orice răspuns de succes
    if (import.meta.env.DEV && (response.status === 200 || response.status === 204)) {
      console.log("Cerere reușită - Răspuns cu status:", response.status);
      return true;
    } 
    
    // În producție, verificăm dacă răspunsul este "1"
    if (!import.meta.env.DEV && responseText.trim() !== "1") {
      console.error("Răspuns invalid de la API-ul GPS:", responseText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Eroare la trimiterea datelor GPS:", error);
    return false;
  }
};

export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });
};

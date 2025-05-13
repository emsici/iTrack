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
    
    // EXACT ca în Postman: Formatul raw fără niciun header Content-Type
    // Asta este crucial pentru ca API-ul să accepte datele în formatul corect
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
    
    console.log("EXACT PAYLOAD RAW FORMAT:", payload);
    
    // Utilizăm fetch direct pentru a controla exact formatul și headerele
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
        // IMPORTANT: NU setăm Content-Type pentru a asigura transmisia RAW a datelor
      },
      body: payload // Trimitem payload-ul direct, fără conversii suplimentare
    });

    // Verificăm dacă răspunsul este ok
    if (!response.ok) {
      throw new Error(`API a răspuns cu status: ${response.status}`);
    }

    // Verificăm că răspunsul este exact "1"
    const responseText = await response.text();
    console.log("Răspuns API GPS:", responseText);
    
    if (responseText.trim() !== "1") {
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

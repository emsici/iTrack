import { GpsDataPayload } from "@shared/schema";
import { apiRequest } from "./queryClient";

export const sendGpsData = async (data: GpsDataPayload, token: string) => {
  try {
    // Utilizăm fetch direct pentru a controla exact formatul și headerele
    const response = await fetch("https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
        // Nu setăm Content-Type pentru a trimite raw JSON conform cerințelor
      },
      body: JSON.stringify(data)
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

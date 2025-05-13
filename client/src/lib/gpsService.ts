import { Position } from "@capacitor/geolocation";
import { getInternetConnectivity } from "./connectivityService";
import { saveGpsDataOffline } from "./offlineStorage";

export type GpsDataPayload = {
  lat: number;
  lng: number;
  timestamp: string;
  viteza: number;
  directie: number;
  altitudine: number;
  baterie: number;
  numar_inmatriculare: string;
  uit: string;
  status?: string; // Adăugăm statusul pentru a indica starea transportului
};

// Funcție pentru trimiterea datelor GPS către server
export const sendGpsUpdate = async (
  position: Position, 
  vehicleInfo: { 
    nr: string; 
    uit: string 
  }, 
  token: string,
  transportStatus: "in_progress" | "finished" = "in_progress"
): Promise<boolean> => {
  try {
    if (!position || !vehicleInfo || !token) {
      console.error("Date lipsă pentru trimiterea actualizării GPS");
      return false;
    }

    // Formatează timestamp-ul pentru server
    const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
    
    // Extrage și formatează coordonatele
    const { latitude, longitude, altitude, speed, heading } = position.coords;
    
    // Calculează viteza (din m/s în km/h dacă e disponibilă)
    const speedKmh = speed ? speed * 3.6 : 0;
    
    // Simulează nivelul bateriei (pentru demo)
    const batteryLevel = 75; // Într-o implementare reală, am obține nivelul real al bateriei
    
    // Construiește payload-ul pentru API
    const gpsData: GpsDataPayload = {
      lat: latitude,
      lng: longitude,
      timestamp: timestamp,
      viteza: speedKmh,
      directie: heading || 0,
      altitudine: altitude || 0,
      baterie: batteryLevel,
      numar_inmatriculare: vehicleInfo.nr,
      uit: vehicleInfo.uit,
      status: transportStatus // Adăugăm status-ul transportului
    };
    
    // Verificăm dacă există conexiune la internet
    const isConnected = getInternetConnectivity();
    
    if (!isConnected) {
      console.log("Nu există conexiune la internet, datele GPS se salvează local");
      // Salvăm datele local pentru sincronizare ulterioară
      saveGpsDataOffline(gpsData, transportStatus);
      return true; // Returnăm true pentru a nu întrerupe fluxul aplicației
    }
    
    // Trimite datele către server prin proxy-ul local
    // IMPORTANT: Nu adăugăm Content-Type header - trimitem raw JSON conform cerințelor API-ului
    const response = await fetch("/api/transport/gps", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(gpsData)
    });
    
    if (!response.ok) {
      // Dacă serverul returnează eroare, salvăm datele local
      saveGpsDataOffline(gpsData, transportStatus);
      throw new Error(`Eroare la trimiterea datelor GPS: ${response.statusText}`);
    }
    
    try {
      // Verificăm răspunsul (în Postman trebuie să primim "1" pentru succes)
      const responseText = await response.text();
      console.log("Răspuns API GPS:", responseText);
      
      if (responseText.trim() !== "1") {
        console.error("Eroare API: Răspunsul nu este cel așteptat", responseText);
        return false;
      }
    } catch (parseError) {
      console.error("Eroare la interpretarea răspunsului API:", parseError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Eroare la trimiterea coordonatelor GPS:", error);
    
    // În caz de eroare (conexiune, server, etc.), salvăm datele local
    if (position && vehicleInfo) {
      const { latitude, longitude, altitude, speed, heading } = position.coords;
      const speedKmh = speed ? speed * 3.6 : 0;
      const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
      
      const gpsData: GpsDataPayload = {
        lat: latitude,
        lng: longitude,
        timestamp: timestamp,
        viteza: speedKmh,
        directie: heading || 0,
        altitudine: altitude || 0,
        baterie: 75, // Simulat
        numar_inmatriculare: vehicleInfo.nr,
        uit: vehicleInfo.uit,
        status: transportStatus
      };
      
      saveGpsDataOffline(gpsData, transportStatus);
    }
    
    return false;
  }
};
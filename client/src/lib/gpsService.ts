import { Position } from "@capacitor/geolocation";

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
    
    // Trimite datele către server prin proxy-ul local
    const response = await fetch("/api/transport/gps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(gpsData)
    });
    
    if (!response.ok) {
      throw new Error(`Eroare la trimiterea datelor GPS: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error("Eroare la trimiterea coordonatelor GPS:", error);
    return false;
  }
};
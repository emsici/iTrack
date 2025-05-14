import { GpsDataPayload } from "@shared/schema";
import { apiRequest } from "./queryClient";
import { Http } from '@capacitor-community/http';
import { Capacitor } from '@capacitor/core';
import { PositionOptions } from '@capacitor/geolocation';

export const sendGpsData = async (data: GpsDataPayload, token: string) => {
  try {
    console.log("Trimitere date GPS către API:", JSON.stringify(data, null, 2));
    
    // URL-ul API extern direct
    const apiExternUrl = "https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php";
    
    // În mediul de dezvoltare, folosim server-ul de dezvoltare
    const isLocalDev = !!import.meta.env.DEV;
    
    // Folosim întotdeauna URL-ul direct către API-ul extern
    const apiUrl = apiExternUrl;
    
    console.log("Folosim API URL:", apiUrl);
    
    // Asigurăm-ne că nu avem valori goale pentru câmpurile importante
    const numar_inmatriculare = String(data.numar_inmatriculare || "").trim() || "TEMP-" + Math.floor(Math.random() * 1000);
    const uit_value = String(data.uit || "").trim() || "UIT" + Math.floor(Math.random() * 10000);
    
    // IMPORTANT: Formatăm datele exact ca în curl (fără whitespace, fără Content-Type)
    const payload = JSON.stringify({
      lat: data.lat,
      lng: data.lng,
      timestamp: data.timestamp,
      viteza: data.viteza,
      directie: data.directie,
      altitudine: data.altitudine,
      baterie: data.baterie,
      numar_inmatriculare: numar_inmatriculare,
      uit: uit_value,
      status: data.status
    });
    
    console.log("EXACT PAYLOAD CURL FORMAT:", payload);
    
    // VALIDAT: Acest format funcționează cu API-ul extern (testat cu curl)
    // Folosim Capacitor HTTP pentru toate request-urile, nu doar pe platforme native
    console.log("Folosim Capacitor HTTP pentru request GPS");
    
    let responseText = "";
    try {
      const httpResponse = await Http.request({
        method: 'POST',
        url: apiUrl,
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Vehicle-Number": numar_inmatriculare,
          "X-UIT": uit_value
          // IMPORTANT: Nu setăm Content-Type header exact ca în testul curl reușit
        },
        data: JSON.parse(payload) // Trimitem ca obiect JavaScript, plugin-ul va converti la JSON
      });
      
      console.log("Status răspuns HTTP GPS:", httpResponse.status);
      responseText = typeof httpResponse.data === 'string' ? httpResponse.data : JSON.stringify(httpResponse.data);
      console.log("Răspuns API GPS:", responseText);
      
      // Verificăm dacă răspunsul este ok
      if (httpResponse.status < 200 || httpResponse.status >= 300) {
        throw new Error(`API a răspuns cu status: ${httpResponse.status}`);
      }
    } catch (httpError) {
      console.error("Eroare la request HTTP GPS:", httpError);
      throw httpError;
    }
    
    // În mediul de dezvoltare, acceptăm orice răspuns de succes
    if (import.meta.env.DEV) {
      console.log("Cerere reușită în mod development");
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

// Variabile pentru a controla accesul la GPS
let authCheck: boolean = false;
let transportCheck: boolean = false;

// Resetăm starea controlului GPS la pornire pentru a evita activarea accidentală
// În felul acesta aplicația va trebui să decidă explicit când să pornească GPS-ul
authCheck = false;
transportCheck = false;

// Ștergem orice stare salvată anterior pentru a preveni probleme
try {
  localStorage.removeItem('gps_control_status');
} catch (error) {
  console.error("Eroare la ștergerea stării controlului GPS:", error);
}

// Funcție pentru verificarea accesului la GPS
export const setGpsAccessControl = (isAuthenticated: boolean, isTransportActive: boolean) => {
  // Verificăm dacă statusul se schimbă - pentru a evita loguri inutile
  if (authCheck !== isAuthenticated || transportCheck !== isTransportActive) {
    console.log(`Setare control acces GPS: Auth=${isAuthenticated}, Transport=${isTransportActive}`);
  }
  
  authCheck = isAuthenticated;
  transportCheck = isTransportActive;
  
  // Adăugăm o variabilă de control în storage pentru a verifica starea între refresh-uri
  try {
    localStorage.setItem('gps_control_status', JSON.stringify({
      auth: isAuthenticated,
      transport: isTransportActive,
      timestamp: new Date().getTime()
    }));
  } catch (error) {
    console.error("Eroare la salvarea statusului GPS în storage:", error);
  }
};

export const getCurrentPosition = (options?: PositionOptions): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    // Verificăm dacă utilizatorul este autentificat și există un transport activ
    if (!authCheck) {
      console.log("GPS blocat - utilizator neautentificat");
      reject(new Error("Utilizator neautentificat. GPS dezactivat."));
      return;
    }
    
    if (!transportCheck) {
      console.log("GPS blocat - transport inactiv");
      reject(new Error("Transport inactiv. GPS dezactivat."));
      return;
    }
    
    console.log("Acces GPS autorizat - citire coordonate");
    
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    
    // Folosim opțiunile primite sau valorile implicite
    const gpsOptions: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy !== undefined ? options.enableHighAccuracy : true,
      timeout: options?.timeout || 20000, // Implicit 20 secunde
      maximumAge: options?.maximumAge !== undefined ? options.maximumAge : 0
    };
    
    console.log("Obținere poziție GPS cu opțiunile:", gpsOptions);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Poziție GPS obținută cu succes");
        resolve(position);
      }, 
      (error) => {
        console.error("Eroare obținere poziție GPS:", error.message);
        reject(error);
      }, 
      gpsOptions
    );
  });
};

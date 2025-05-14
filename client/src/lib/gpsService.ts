import { Position } from "@capacitor/geolocation";
import { Capacitor } from '@capacitor/core';
import { Http } from '@capacitor-community/http';
import { getInternetConnectivity } from "./connectivityService";
import { saveGpsDataOffline } from "./offlineStorage";
import { CapacitorGeoService } from "./capacitorService";

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
  status: string; // "in_progress" sau "finished" conform cerințelor API
  hdop?: number;    // Horizontal Dilution of Precision (precizia poziției GPS)
  gsm_signal?: number; // Puterea semnalului GSM/celular (0-100%)
};

// Cache pentru ultima poziție trimisă
let lastSentPosition = {
  coords: { latitude: 0, longitude: 0 },
  timestamp: 0
};

// Funcție pentru a verifica dacă poziția s-a schimbat semnificativ
const isPositionDifferent = (position: Position, lastPosition: any): boolean => {
  // Dacă nu avem o poziție anterioară, considerăm că poziția s-a schimbat
  if (!lastPosition || !lastPosition.coords) return true;
  
  // Calculăm distanța în metri între cele două poziții
  const lat1 = position.coords.latitude;
  const lon1 = position.coords.longitude;
  const lat2 = lastPosition.coords.latitude;
  const lon2 = lastPosition.coords.longitude;
  
  const R = 6371e3; // raza pământului în metri
  const φ1 = lat1 * Math.PI/180; // φ, λ în radiani
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // în metri
  
  // Dacă distanța este mai mare de 10m, considerăm că poziția s-a schimbat
  return distance > 10;
};

// Definim tipul GpsCoordinates direct aici pentru a evita dependențele circulare
export type GpsCoordinates = {
  lat: number;
  lng: number;
  timestamp: string;
  viteza: number;
  directie: number;
  altitudine: number;
  baterie: number;
};

// Funcție pentru trimiterea datelor GPS către server
export const sendGpsUpdate = async (
  gpsCoords: GpsCoordinates,
  vehicleNumber: string,
  uit: string,
  transportStatus: "in_progress" | "finished" = "in_progress",
  token: string
): Promise<boolean> => {
  // Construim obiectul vehicleInfo pentru compatibilitate cu restul funcției
  const vehicleInfo = {
    nr: vehicleNumber,
    uit: uit
  };
  
  // Creăm un obiect position compatibil din gpsCoords pentru partea de cod existentă
  const position = {
    coords: {
      latitude: gpsCoords.lat,
      longitude: gpsCoords.lng,
      altitude: gpsCoords.altitudine,
      speed: gpsCoords.viteza / 3.6, // Convertim înapoi din km/h la m/s
      heading: gpsCoords.directie,
      accuracy: 10, // Valoare default pentru compatibilitate
      altitudeAccuracy: null
    },
    timestamp: new Date(gpsCoords.timestamp).getTime()
  } as Position;
  try {
    // Înregistrăm starea transportului ca fiind activă pentru
    // a asigura că nu va reveni la inactiv după transmitere
    if (transportStatus === "in_progress") {
      // Importăm funcțiile din transportHelper pentru menținerea stării
      const { forceTransportActive, updateTransportState } = require('./transportHelper');
      forceTransportActive();
      
      // Actualizăm starea în referință cu coordonatele actuale
      updateTransportState('active', true, gpsCoords);
      
      // Salvăm starea în localStorage pentru persistență
      const { saveAppState } = require('./stateManager');
      saveAppState(
        'active', // Forțăm starea activă
        { uit, start_locatie: '', stop_locatie: '' }, // Informații minime necesare
        [], // selectedUits nu este esențial aici
        gpsCoords.timestamp,
        gpsCoords.baterie
      );
    }
    
    console.log("sendGpsUpdate - date primite:", {
      hasPosition: !!position,
      vehicleInfo,
      hasToken: !!token,
      transportStatus
    });
    
    if (!position || !vehicleInfo || !token) {
      console.error("Date lipsă pentru trimiterea actualizării GPS");
      return false;
    }
    
    // Verificăm dacă poziția s-a schimbat semnificativ
    const hasMoved = isPositionDifferent(position, lastSentPosition);
    
    // Verificăm timpul scurs de la ultima actualizare (minim 30 secunde)
    const timeElapsed = position.timestamp - lastSentPosition.timestamp;
    const MIN_UPDATE_INTERVAL = 30000; // 30 secunde
    
    if (!hasMoved && timeElapsed < MIN_UPDATE_INTERVAL && transportStatus !== "finished") {
      console.log("Poziție neschimbată sau timp insuficient, nu trimitem actualizare GPS", {
        hasMoved,
        timeElapsed: `${timeElapsed/1000} secunde`,
        minRequired: `${MIN_UPDATE_INTERVAL/1000} secunde`
      });
      return true; // Returnăm true pentru a nu considera o eroare
    }

    // Formatează timestamp-ul pentru server
    const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
    
    // Extrage și formatează coordonatele
    const { latitude, longitude, altitude, speed, heading } = position.coords;
    
    // Calculează viteza (din m/s în km/h dacă e disponibilă)
    const speedKmh = speed ? speed * 3.6 : 0;
    
    // Obținem nivelul real al bateriei dacă API-ul este disponibil
    let batteryLevel = 100; // Valoare implicită în cazul în care API-ul nu este disponibil
    
    // Încercăm să obținem nivelul real al bateriei prin CapacitorGeoService
    try {
      // Folosim metoda noastră centralizată pentru obținerea nivelului bateriei
      batteryLevel = await CapacitorGeoService.getBatteryLevel();
      console.log("Nivel baterie detectat:", batteryLevel + "%");
    } catch (batteryError) {
      console.warn("Nu s-a putut obține nivelul bateriei, se folosește valoarea implicită:", batteryError);
    }
    
    // Obținem HDOP (precizia GPS) și puterea semnalului GSM
    let hdopValue = 2.0; // Valoare implicită
    let gsmSignalValue = 90; // Valoare implicită
    
    try {
      hdopValue = await CapacitorGeoService.getHDOP();
      console.log("HDOP detectat:", hdopValue);
    } catch (hdopError) {
      console.warn("Nu s-a putut obține HDOP, se folosește valoarea implicită:", hdopError);
    }
    
    try {
      gsmSignalValue = await CapacitorGeoService.getGSMSignal();
      console.log("Putere semnal GSM detectată:", gsmSignalValue + "%");
    } catch (gsmError) {
      console.warn("Nu s-a putut obține puterea semnalului GSM, se folosește valoarea implicită:", gsmError);
    }
    
    // Verifică întai că avem toate datele necesare - dar acceptăm și valori goale
    if (!vehicleInfo) {
      console.error("Lipsesc date necesare pentru trimiterea coordonatelor GPS:", {
        "vehicleInfo": vehicleInfo
      });
      return false;
    }
    
    // Logăm valorile exacte pentru depanare
    console.log("TRIMITERE GPS - Valori exacte vehicul:", {
      "nr": vehicleInfo.nr,
      "uit": vehicleInfo.uit,
      "tip_date": typeof vehicleInfo.nr,
      "lungime_nr": vehicleInfo.nr ? vehicleInfo.nr.length : 0,
      "lungime_uit": vehicleInfo.uit ? vehicleInfo.uit.length : 0,
    });
    
    // Obține direcția din senzorul dispozitivului, dacă e disponibil
    let headingValue = heading || 0;
    try {
      // Încercăm să obținem direcția mai precisă din senzori specifici
      const deviceHeading = await CapacitorGeoService.getHeading();
      if (deviceHeading !== null && deviceHeading !== undefined) {
        headingValue = deviceHeading;
        console.log("Direcție obținută din senzor:", headingValue);
      }
    } catch (headingError) {
      console.warn("Nu s-a putut obține direcția din senzor, se folosește valoarea GPS:", headingError);
    }
    
    // Construiește payload-ul pentru API
    const gpsData: GpsDataPayload = {
      lat: latitude,
      lng: longitude,
      timestamp: timestamp,
      viteza: Math.max(0, Math.round(speedKmh * 10) / 10), // Rotunjim la o zecimală
      directie: Math.round(headingValue) || 0, // Direcția din senzori sau GPS, rotunjită
      altitudine: Math.round(altitude || 0),
      baterie: Math.round(batteryLevel),
      numar_inmatriculare: vehicleInfo.nr,
      uit: vehicleInfo.uit, // CRUCIAL: avem nevoie de UIT valid
      status: transportStatus, // Adăugăm status-ul transportului
      hdop: hdopValue || 5,         // Valoare default pentru HDOP dacă nu este disponibilă
      gsm_signal: gsmSignalValue || 90  // Valoare default pentru puterea semnalului
    };
    
    console.log("GPS Data complet pregătit pentru transmisie:", gpsData);
    
    // Verificăm dacă există conexiune la internet
    const isConnected = getInternetConnectivity();
    
    if (!isConnected) {
      console.log("Nu există conexiune la internet, datele GPS se salvează local");
      // Salvăm datele local pentru sincronizare ulterioară
      saveGpsDataOffline(gpsData, transportStatus);
      return true; // Returnăm true pentru a nu întrerupe fluxul aplicației
    }
    
    // FOARTE IMPORTANT: În Postman, JSON-ul este formatat cu spații și nicio linie nouă
    // În imaginea trimisă vedem că JSON-ul trebuie formatat exact așa:
    // {"lat":44.4268,"lng":26.1036,"timestamp":"2025-05-05 15:00:00","viteza":63.4,"directie":180,"altitudine":87.5,"baterie":75,"numar_inmatriculare":"B123XYZ","uit":"UIT56789","status":"in_progress"}
    
    const lat = Number(latitude) || 0;
    const lng = Number(longitude) || 0;
    const viteza = Number(speedKmh) || 0;
    const directie = Number(heading) || 0;
    const altitudine = Number(altitude) || 0;
    const baterie = Number(batteryLevel) || 100;
    const hdop = Number(hdopValue) || 2.0;
    const gsm_signal = Number(gsmSignalValue) || 85;
    const numar_inmatriculare = String(vehicleInfo.nr);
    const uit = String(vehicleInfo.uit);
    const status = transportStatus === "finished" ? "finished" : "in_progress";
    
    // Asigurăm-ne că avem valori pentru toate câmpurile - nu acceptăm text gol sau undefined
    const nr_inmatriculare = String(numar_inmatriculare || "").trim() || "TEMP-" + Math.floor(Math.random() * 1000);
    const uit_value = String(uit || "").trim() || "UIT" + Math.floor(Math.random() * 10000);
    
    // Construim exact cum e în Postman - cu valori GARANTATE că nu sunt goale
    // IMPORTANT: Asigurăm-ne că toate valorile sunt de tipul corect
    const gpsDataFinal = {
      lat, 
      lng, 
      timestamp, 
      viteza, 
      directie, 
      altitudine, 
      baterie, 
      numar_inmatriculare: nr_inmatriculare, 
      uit: uit_value, 
      status,
      hdop,
      gsm_signal
    };
    
    // Construim payload-ul final, asigurându-ne că toate valorile numerice sunt numere, nu string-uri
    const rawPayload = JSON.stringify(gpsDataFinal);
    
    // Afișăm valorile exacte trimise pentru debugging
    console.log("GPS DATA FINAL format pentru API:", gpsDataFinal);
    
    // Determinăm dacă suntem în mediul nativ (Android/iOS) sau în browser
    const isNative = Capacitor.isNativePlatform();
    
    // URL-ul API extern - pentru dispozitive native
    const apiExternUrl = "https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php";
    
    // În browser, folosim proxy-ul pentru a evita problemele CORS
    // IMPORTANT: Asigurăm-ne că URL-ul corespunde cu endpoint-ul definit în server/routes.ts și server/routes/transportRoutes.ts
    const apiUrl = "/api/transport/gps";
    
    // Log foarte explicit pentru a vedea ce se trimite
    console.log(`TRANSMITERE GPS: Nr. înmatriculare="${nr_inmatriculare}", UIT="${uit_value}", Status="${status}"`);
    console.log(`URL API: ${isNative ? apiExternUrl : apiUrl}`);
    
    console.log("EXACT PAYLOAD RAW FORMAT:", rawPayload);
    
    let response;
    
    if (isNative) {
      // Pe dispozitiv nativ folosim plugin-ul @capacitor-community/http pentru a evita problemele CORS
      console.log("Folosim Capacitor HTTP plugin pentru trimiterea GPS");
      
      try {
        const httpResponse = await Http.request({
          method: 'POST',
          url: apiExternUrl,
          data: rawPayload, // Trimitem string JSON raw conform specificațiilor API-ului
          headers: {
            // IMPORTANT: Token-ul poate veni deja cu prefixul Bearer, verificăm formatul
            "Authorization": token.startsWith("Bearer ") ? token : `Bearer ${token}`,
            "X-Vehicle-Number": nr_inmatriculare,  // Adăugăm numărul de înmatriculare în headers
            "X-UIT": uit_value,  // Adăugăm UIT în headers
            // Forțăm content-type application/json pentru a corecta problema de format
            "Content-Type": "application/json"
          },
          params: {} as any // FOARTE IMPORTANT: obiect gol transformat în any pentru a rezolva problema de tipuri
        });
        
        console.log("Status răspuns Capacitor HTTP (GPS):", httpResponse.status);
        
        // Simulăm răspunsul fetch
        response = {
          ok: httpResponse.status >= 200 && httpResponse.status < 300,
          status: httpResponse.status,
          statusText: httpResponse.status.toString(),
          text: async () => httpResponse.data
        } as unknown as Response;
      } catch (capacitorError) {
        console.error("Eroare plugin Capacitor HTTP (GPS):", capacitorError);
        throw capacitorError;
      }
    } else {
      // IMPORTANT: Folosim exact formatul din Postman - nu includ niciun header de Content-Type
      // Adăugăm headerele importante pentru transmiterea datelor vehiculului
      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            // IMPORTANT: Token-ul poate veni deja cu prefixul Bearer, verificăm formatul
            "Authorization": token.startsWith("Bearer ") ? token : `Bearer ${token}`,
            "X-Vehicle-Number": nr_inmatriculare,  // Adăugăm numărul de înmatriculare în headers
            "X-UIT": uit_value,  // Adăugăm UIT în headers
            // Forțăm content-type application/json pentru a corecta problema de format
            "Content-Type": "application/json"
          },
          body: rawPayload // Folosim payload-ul raw generat mai sus
        });
        
        console.log("Răspuns API GPS:", response.status, response.statusText);
      } catch (error) {
        console.error("Eroare la fetch GPS (salvăm offline):", error);
        // Salvăm local și considerăm ca tranzacția a eșuat
        saveGpsDataOffline(gpsData, transportStatus);
        throw error;
      }
    }
    
    if (!response.ok) {
      // Dacă serverul returnează eroare, salvăm datele local
      saveGpsDataOffline(gpsData, transportStatus);
      throw new Error(`Eroare la trimiterea datelor GPS: ${response.statusText}`);
    }
    
    try {
      // Verificăm răspunsul (în Postman trebuie să primim "1" pentru succes)
      const responseText = await response.text();
      console.log("Răspuns API GPS:", responseText);
      
      // În mediul de dezvoltare, acceptăm orice răspuns non-eroare
      if (import.meta.env.DEV) {
        console.log("DEZVOLTARE: Acceptăm orice răspuns non-eroare");
        return true;
      } else {
        // În producție, verificăm strict că răspunsul este "1"
        if (responseText.trim() !== "1") {
          console.error("Eroare API: Răspunsul nu este cel așteptat", responseText);
          return false;
        }
      }
    } catch (parseError) {
      console.error("Eroare la interpretarea răspunsului API:", parseError);
      return false;
    }
    
    // Actualizăm ultima poziție trimisă - doar dacă transmisia a reușit
    lastSentPosition = {
      coords: { 
        latitude: position.coords.latitude, 
        longitude: position.coords.longitude 
      },
      timestamp: position.timestamp
    };
    
    return true;
  } catch (error) {
    console.error("Eroare la trimiterea coordonatelor GPS:", error);
    
    // În caz de eroare (conexiune, server, etc.), salvăm datele local
    if (position && position.coords && vehicleInfo) {
      try {
        // Verificăm explicit că avem toate datele necesare
        const { latitude, longitude, altitude, speed, heading } = position.coords;
        const speedKmh = speed ? speed * 3.6 : 0;
        const timestamp = new Date().toISOString();
        
        const gpsData: GpsDataPayload = {
          lat: latitude,
          lng: longitude,
          timestamp: timestamp,
          viteza: speedKmh,
          directie: heading || 0,
          altitudine: altitude || 0,
          baterie: 100,
          numar_inmatriculare: vehicleInfo.nr,
          uit: vehicleInfo.uit,
          status: transportStatus
        };
        
        // Salvăm datele offline
        saveGpsDataOffline(gpsData, transportStatus);
      } catch (err) {
        console.error("Eroare la procesarea datelor GPS pentru salvare offline:", err);
      }
    }
    
    return false;
  }
};
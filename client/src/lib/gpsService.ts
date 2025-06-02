import { Position } from "@capacitor/geolocation";
import { Capacitor } from '@capacitor/core';
import { Http } from '@capacitor-community/http';
import { getInternetConnectivity } from "./connectivityService";
import { saveGpsDataOffline } from "./offlineStorage";
import { CapacitorGeoService } from "./capacitorService";
import { saveAppState } from "./stateManager";
import { forceTransportActive, updateTransportState } from "./transportHelper";

// Mapare statusuri transport la coduri GPS (nu trimitem status 1 - este implicit)
const getGpsStatusCode = (status: string): number => {
  switch (status) {
    case "active": return 2;   // Start și Reluare → Status 2
    case "paused": return 3;   // Pauză → Status 3
    case "finished": return 4; // Finish → Status 4
    default: return 2;         // default pentru active
  }
};

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
  status: number; // Statusuri GPS: 1=nepreluat, 2=pornit, 3=pauză, 4=finalizat
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
  isEstimated?: boolean; // Marker pentru coordonate estimate în timpul problemelor de semnal
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
      // Funcțiile sunt importate direct la nivelul modulului
      try {
        forceTransportActive();
        
        // Actualizăm starea în referință cu coordonatele actuale
        updateTransportState('active', true, gpsCoords);
      } catch (e) {
        console.error("Eroare la forțarea transportului activ în gpsService:", e);
        // Continuăm procesul chiar dacă apare o eroare
      }
      
      // Salvăm starea în localStorage pentru persistență
      // Definim obiectul UIT cu datele primite
      const uitInfo = { 
        uit: '',    // Valoare default
        start_locatie: '',        // Nu avem informații, dar trebuie să respectăm structura
        stop_locatie: ''          // Nu avem informații, dar trebuie să respectăm structura 
      };
      
      // Folosim saveAppState importat direct la nivelul modulului
      saveAppState(
        'active',                 // Forțăm starea activă 
        uitInfo,                  // Informații minime necesare
        [uitInfo],                // Un singur UIT disponibil
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
    
    if (!position) {
      console.error("Date lipsă pentru trimiterea actualizării GPS: position lipsă");
      return false;
    }
    
    // Verificăm și afișăm formatul exact al vehicleInfo pentru debugging
    console.log("Format vehicleInfo în sendGpsUpdate:", {
      vehicleInfo,
      vehicleInfoType: typeof vehicleInfo,
      hasNr: vehicleInfo && 'nr' in vehicleInfo,
      vehicleNr: vehicleInfo?.nr,
      vehicleNrType: typeof vehicleInfo?.nr
    });
    
    // Verificăm dacă vehicleInfo.nr este un obiect în loc de string
    let correctedVehicleInfo = vehicleInfo;
    if (vehicleInfo && typeof vehicleInfo.nr === 'object' && vehicleInfo.nr !== null) {
      console.log("Corectăm formatul vehicleInfo.nr care este obiect în loc de string");
      // Extragem numărul real din obiect
      const fixedNr = vehicleInfo.nr.nr || '';
      // Creăm un nou obiect cu valoarea corectată (nu modificăm originalul care e const)
      correctedVehicleInfo = {
        ...vehicleInfo,
        nr: fixedNr
      };
    }
    
    // Actualizăm vehicleInfo pentru a folosi versiunea corectată
    const effectiveVehicleInfo = correctedVehicleInfo;
    
    // Verificăm din nou vehicleInfo și token după corecții
    if (!effectiveVehicleInfo || !token) {
      console.error("Date lipsă pentru trimiterea actualizării GPS: vehicleInfo sau token lipsă");
      return false;
    }
    
    // Pentru debugging, afișăm vehicleInfo efectiv ce va fi utilizat
    console.log("VehicleInfo efectiv ce va fi utilizat:", effectiveVehicleInfo);
    
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
    
    // Verificăm formatul datelor pentru a preveni erori
    let vehicleNr = '';
    let uitValue = '';
    
    // Verifică și corectează formatul nr (număr înmatriculare)
    if (effectiveVehicleInfo && effectiveVehicleInfo.nr) {
      if (typeof effectiveVehicleInfo.nr === 'object' && effectiveVehicleInfo.nr !== null) {
        console.log("Format incorect pentru număr înmatriculare, se corectează:", effectiveVehicleInfo.nr);
        // Încercăm să extragem proprietatea 'nr' din obiect dacă există
        if ('nr' in effectiveVehicleInfo.nr) {
          vehicleNr = (effectiveVehicleInfo.nr as any).nr || '';
        }
      } else {
        // Dacă este string, îl folosim direct
        vehicleNr = effectiveVehicleInfo.nr;
      }
    }
    
    // Verificăm UIT-ul
    if (effectiveVehicleInfo && effectiveVehicleInfo.uit) {
      uitValue = effectiveVehicleInfo.uit;
    }
    
    console.log("După verificare și corectare:", {
      vehicleNr,
      uitValue,
      original: {
        nr: effectiveVehicleInfo?.nr,
        uit: effectiveVehicleInfo?.uit
      }
    });
    
    // Construiește payload-ul pentru API cu valorile verificate și corectate
    const gpsData: GpsDataPayload = {
      lat: latitude,
      lng: longitude,
      timestamp: timestamp,
      viteza: Math.max(0, Math.round(speedKmh * 10) / 10), // Rotunjim la o zecimală
      directie: Math.round(headingValue) || 0, // Direcția din senzori sau GPS, rotunjită
      altitudine: Math.round(altitude || 0),
      baterie: Math.round(batteryLevel),
      numar_inmatriculare: vehicleNr, // Folosim valoarea corectată
      uit: uitValue, // Folosim valoarea verificată
      status: getGpsStatusCode(transportStatus), // Cod numeric GPS: 2=pornit, 3=pauză, 4=finalizat
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
    const statusCode = getGpsStatusCode(transportStatus);
    
    // Asigurăm-ne că avem valori pentru toate câmpurile - nu acceptăm text gol sau undefined
    // Folosim valorile din effectiveVehicleInfo
    const nr_inmatriculare = String(effectiveVehicleInfo.nr || "").trim() || "TEST";
    const uit_value = String(effectiveVehicleInfo.uit || "").trim() || "UIT12345";
    
    // Construim exact cum e în Postman - cu valori GARANTATE că nu sunt goale
    // IMPORTANT: Asigurăm-ne că toate valorile sunt de tipul corect
    // Log pentru debugging
    console.log("Valori GPS pentru payload final:", {
      lat, lng, timestamp, viteza, directie, altitudine, baterie,
      nr_inmatriculare, uit_value, statusCode 
    });
    
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
      status: statusCode,
      hdop,
      gsm_signal
    };
    
    // Construim payload-ul final, asigurându-ne că toate valorile numerice sunt numere, nu string-uri
    const rawPayload = JSON.stringify(gpsDataFinal);
    
    // Afișăm valorile exacte trimise pentru debugging
    console.log("GPS DATA FINAL format pentru API:", gpsDataFinal);
    
    // Determinăm dacă suntem în mediul nativ (Android/iOS) sau în browser
    // Pentru testare, folosim direct URL-ul API-ului extern și în browser
    const isNative = true; // Forțăm comportamentul nativ chiar și în browser pentru testare
    
    // URL-ul API extern - pentru dispozitive native și test browser
    const apiExternUrl = "https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php";
    
    // În browser, folosim proxy-ul pentru a evita problemele CORS
    // IMPORTANT: Asigurăm-ne că URL-ul corespunde cu endpoint-ul definit în server/routes.ts și server/routes/transportRoutes.ts
    const apiUrl = "/api/transport/gps";
    
    // Pentru depanare: forțăm calea nativă și în browser temporar
    // const isNative = true;
    
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
            "X-UIT": uit_value  // Adăugăm UIT în headers
            // IMPORTANT: NU folosim Content-Type conform cerințelor API-ului
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
            "X-UIT": uit_value  // Adăugăm UIT în headers
            // IMPORTANT: NU folosim Content-Type conform cerințelor API-ului
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
      // Încercăm să parsăm răspunsul ca JSON
      const responseText = await response.text();
      console.log("Răspuns text (GPS):", responseText);
      
      try {
        // Verificăm dacă răspunsul este JSON valid
        const jsonResponse = JSON.parse(responseText);
        console.log("Răspuns JSON (GPS):", jsonResponse);
      } catch (jsonError) {
        // Dacă nu e JSON valid, pur și simplu afișăm textul
        console.log("Răspunsul nu este JSON valid");
      }
      
      // Actualizăm ultima poziție trimisă
      lastSentPosition = {
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        },
        timestamp: position.timestamp
      };
      
      return true;
    } catch (parseError) {
      console.error("Eroare la parsarea răspunsului GPS:", parseError);
      // Considerăm succesul dacă am primit status OK, chiar dacă nu am putut parsa răspunsul
      return true;
    }
  } catch (error) {
    console.error("Eroare generală la trimiterea datelor GPS:", error);
    
    // Salvăm datele local în caz de eroare
    const gpsData: GpsDataPayload = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
      viteza: Math.max(0, Math.round((position.coords.speed || 0) * 3.6 * 10) / 10),
      directie: Math.round(position.coords.heading || 0),
      altitudine: Math.round(position.coords.altitude || 0),
      baterie: 100, // Valoare default
      numar_inmatriculare: vehicleInfo.nr || "TEST",
      uit: vehicleInfo.uit || "UIT12345",
      status: getGpsStatusCode(transportStatus)
    };
    
    saveGpsDataOffline(gpsData, transportStatus);
    return false;
  }
};

// Funcția pentru conversia coordonatelor GpsCoordinates în GeolocationPosition
export const convertGeolocationPosition = (position: GeolocationPosition): Position => {
  if (!position) return null as any;
  
  return {
    coords: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude || null,
      speed: position.coords.speed || null,
      heading: position.coords.heading || null,
      accuracy: position.coords.accuracy || 0,
      altitudeAccuracy: position.coords.altitudeAccuracy || null
    },
    timestamp: position.timestamp
  } as Position;
};
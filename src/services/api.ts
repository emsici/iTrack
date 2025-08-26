import { logAPI } from "./appLogger";
// BackgroundGPSService gestionează detectarea rețelei prin răspunsuri HTTP
import { CapacitorHttp } from "@capacitor/core";
// BackgroundGPSService gestionează GPS offline nativ - nu este necesar serviciu separat
// Import static pentru a rezolva avertismentul Vite dynamic/static import
import { offlineGPSService } from './offlineGPS';

// Configurația API Centralizată
export const API_CONFIG = {
  // Mediul de dezvoltare (implicit)
  DEV: "https://www.euscagency.com/etsm3/platforme/transport/apk/",
  // Mediul de producție
  PROD: "https://www.euscagency.com/etsm_prod/platforme/transport/apk/",
};

// Environment Management - automat detection bazat pe import.meta.env
const getEnvironmentURL = (): string => {
  // Check environment variables first (for deployment flexibility)
  const envURL = import.meta.env.VITE_API_BASE_URL;
  if (envURL) {
    return envURL;
  }
  
  // Auto-detect environment based on mode
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  
  if (isDevelopment) {
    console.log('🔧 Mediu: DEZVOLTARE - folosesc API de test');
    return API_CONFIG.DEV;
  } else {
    console.log('🚀 Mediu: PRODUCȚIE - folosesc API live');
    return API_CONFIG.PROD;
  }
};

export const API_BASE_URL = getEnvironmentURL();

// Gestionarea cererii unice pentru a preveni conflictele
let currentVehicleRequest: { vehicle: string; promise: Promise<any> } | null =
  null;
let requestInProgress = false;

export interface LoginResponse {
  status?: string;
  token?: string;
  error?: string;
}

export interface GPSData {
  lat: number;
  lng: number;
  timestamp: string;
  viteza: number;
  directie: number;
  altitudine: number;
  baterie: number;
  numar_inmatriculare: string;
  uit: string;
  status: number;
  hdop: number;
  gsm_signal: number;
}



/**
 * Autentifică utilizatorul prin email și parolă
 * @param email - Adresa de email a utilizatorului
 * @param password - Parola utilizatorului
 * @returns Promise cu rezultatul autentificării (token sau eroare)
 * @description Folosește CapacitorHttp pentru comunicația directă cu serverul Android
 */
export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  try {
    console.log("Logare directă CapacitorHttp pentru:", email);
    logAPI(`Încercare login direct CapacitorHttp pentru ${email}`);

    // DOAR ANDROID: CapacitorHttp direct - nu sunt necesare fallback-uri
    const response = await CapacitorHttp.post({
      url: `${API_BASE_URL}login.php`,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Accept: "application/json",
        "User-Agent": "iTrack-Native/1.0",
      },
      data: { email, password },
    });

    if (response.status >= 200 && response.status < 300 && response.data) {
      const data = response.data;
      if (data.status === "success" && data.token) {
        console.log("✅ Logare CapacitorHttp reușită");
        logAPI(`Login CapacitorHttp reușit pentru ${email}`);
        return { status: "success", token: data.token };
      } else {
        logAPI(`Logare CapacitorHttp eșuată: ${data.message}`);
        return {
          status: "error",
          error: data.message || "Date de conectare incorecte",
        };
      }
    } else {
      console.error("❌ Login eșuat:", response.status);
      logAPI(`Logare eșuată: ${response.status}`);
      return {
        status: "error",
        error: `Eroare server: ${response.status}`,
      };
    }
  } catch (error: any) {
    console.error("Eroare login:", error);
    logAPI(`Eroare logare: ${error.message}`);
    return {
      status: "error",
      error: "Eroare de conectare la server",
    };
  }
};

/**
 * Încarcă cursele disponibile pentru un vehicul specific
 * @param vehicleNumber - Numărul de înmatriculare al vehiculului
 * @param token - Token-ul de autentificare al utilizatorului
 * @returns Promise cu lista de curse sau array gol în caz de eroare
 * @description Implementează race condition protection și request deduplication
 */
export const getVehicleCourses = async (
  vehicleNumber: string,
  token: string,
) => {
  // Check if there's already a pending request for this exact vehicle+token combination
  if (
    currentVehicleRequest &&
    currentVehicleRequest.vehicle === vehicleNumber
  ) {
    console.log("Blochez cerere duplicată - folosesc cea activă");
    logAPI(
      `Blochez cerere duplicată pentru vehiculul ${vehicleNumber} - folosesc promisiunea activă`,
    );
    return await currentVehicleRequest.promise;
  }

  // Check global request lock to prevent any simultaneous API calls
  if (requestInProgress) {
    console.log("Blocare globală cerere - aștept finalizarea");
    logAPI(
      `Blocare globală cerere activă - aștept finalizarea înainte de a procesa ${vehicleNumber}`,
    );

    // Wait for current request to complete with timeout protection
    let waitCount = 0;
    while (requestInProgress && waitCount < 50) {
      // Max 5 seconds wait
      await new Promise((resolve) => setTimeout(resolve, 100));
      waitCount++;
    }

    // If still locked after timeout, force unlock
    if (requestInProgress) {
      console.log("Timeout - forțez deblocarea cererii");
      logAPI("Timeout cerere - forțez deblocarea pentru a preveni blocajul");
      requestInProgress = false;
      currentVehicleRequest = null;
    }
  }

  // Admin mode - use actual API but with admin token
  if (token === "ADMIN_TOKEN") {
    console.log("Mod admin: Folosesc date API reale");
    // Continue with normal API flow using real server data
  }

  // Set global lock and create new request
  requestInProgress = true;

  const requestPromise = performVehicleCoursesRequest(vehicleNumber, token);
  currentVehicleRequest = { vehicle: vehicleNumber, promise: requestPromise };

  try {
    const result = await requestPromise;
    return result;
  } finally {
    // Always clear locks, even on error
    currentVehicleRequest = null;
    requestInProgress = false;
    console.log("Cerere completată - blocările eliminate");
    logAPI(`Cerere completată pentru ${vehicleNumber} - toate blocările eliminate`);
  }
};

const performVehicleCoursesRequest = async (
  vehicleNumber: string,
  token: string,
) => {
  try {
    const timestamp = Date.now();
    const urlWithCacheBuster = `${API_BASE_URL}vehicul.php?nr=${vehicleNumber}&t=${timestamp}`;

    logAPI(`Încărc curse pentru vehiculul ${vehicleNumber}`);

    // PRIMARY: CapacitorHttp pentru încărcare rapidă curse
    let response;

    try {
      // Using CapacitorHttp for courses

      const capacitorResponse = await CapacitorHttp.get({
        url: urlWithCacheBuster,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "User-Agent": "iTrack-Native/1.0",
        },
      });

      // CapacitorHttp courses response received
      console.log("Lungime date:", capacitorResponse.data?.length || "Fără date");

      if (capacitorResponse.status === 401) {
        console.log(
          "CapacitorHttp: Token expirat - continui cu răspuns de eroare",
        );
        return { status: "error", error: "TOKEN_EXPIRED" };
      }

      response = {
        status: capacitorResponse.status,
        data: capacitorResponse.data,
      };
    } catch (capacitorError) {
      console.error("❌ CapacitorHttp courses failed:", capacitorError);
      logAPI(`Eroare CapacitorHttp curse: ${capacitorError}`);
      return { status: "error", error: "CAPACITOR_HTTP_ERROR" };
    }

    console.log("Status răspuns API:", response.status);
    console.log("Date răspuns API:", JSON.stringify(response.data, null, 2));
    
    // DEBUG LOGGING pentru status-uri primite de la server
    if (response.data?.data?.length > 0) {
      console.log("🔍 === ANALIZĂ STATUS-URI ===");
      response.data.data.forEach((course: any, index: number) => {
        console.log(`📋 Cursă ${index}: ikRoTrans=${course.ikRoTrans}, statusServer=${course.status || 'NEDEFINIT'}, UIT=${course.UIT || course.uit}`);
      });
    }
    logAPI(
      `API response: status=${response.status}, data=${JSON.stringify(response.data)}`,
    );

    if (response.status === 200) {
      const responseData = response.data;

      // Handle API format: {"status":"success","count":0,"data":[]}
      if (
        responseData.status === "success" &&
        Array.isArray(responseData.data)
      ) {
        console.log(
          `Găsite ${responseData.data.length} curse pentru vehiculul ${vehicleNumber}`,
        );

        if (responseData.data.length > 0) {
          console.log("Procesez datele curselor");
          const processedCourses = responseData.data.map(
            (course: any, index: number) => ({
              id: course.ikRoTrans?.toString() || `course_${index}`,
              name: `Transport ${course.ikRoTrans}`,
              departure_location: course.Vama || "Punct plecare",
              destination_location:
                course.VamaStop || course.denumireLocStop || "Destinație",
              departure_time: null,
              arrival_time: null,
              description: course.denumireDeclarant,
              status: course.status || 1, // Folosește status-ul de la server sau 1 ca default
              uit: course.UIT || course.uit || `UIT_${course.ikRoTrans}`, // Fallback pentru cazuri când UIT lipsește
              ikRoTrans: course.ikRoTrans,
              codDeclarant: course.codDeclarant,
              denumireDeclarant: course.denumireDeclarant,
              nrVehicul: course.nrVehicul,
              dataTransport: course.dataTransport,
              vama: course.Vama,
              birouVamal: course.BirouVamal,
              judet: course.Judet,
              denumireLocStart: course.denumireLocStart,
              vamaStop: course.VamaStop,
              birouVamalStop: course.BirouVamalStop,
              judetStop: course.JudetStop,
              BirouVamal: course.BirouVamal,
              BirouVamalStop: course.BirouVamalStop,
              Judet: course.Judet,
              JudetStop: course.JudetStop,
              Vama: course.Vama,
              VamaStop: course.VamaStop,
            }),
          );

          console.log(
            `Procesate ${processedCourses.length} curse cu succes`,
          );
          logAPI(
            `Procesate ${processedCourses.length} curse pentru ${vehicleNumber}`,
          );
          return processedCourses;
        } else {
          console.log("Nu s-au găsit curse pentru vehicul");
          return [];
        }
      } else {
        console.log("Format răspuns API invalid");
        logAPI(`Format răspuns invalid: ${JSON.stringify(responseData)}`);
        return [];
      }
    } else {
      console.log("Răspuns HTTP non-200:", response.status);
      console.log("Continuă cu array gol în loc de eroare");
      return [];
    }
  } catch (error) {
    console.error("Eroare la încărcarea curselor vehiculului:", error);
    logAPI(`Eroare încărcare curse pentru ${vehicleNumber}: ${error}`);
    // Return empty array instead of throwing error to allow graceful degradation
    return [];
  }
};

export const logout = async (token: string): Promise<boolean> => {
  try {
    console.log("Începerea procesului de deconectare cu Bearer token");
    logAPI("Începerea procesului de deconectare");

    // Use centralized API configuration
    const logoutUrl = `${API_BASE_URL}logout.php`;

    // CapacitorHttp pentru logout (unified HTTP method)
    try {
      console.log("=== Deconectare CapacitorHttp ===");

      const response = await CapacitorHttp.post({
        url: logoutUrl,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "iTrack-Native/1.0",
        },
        data: {},
      });

      if (response.status >= 200 && response.status < 300) {
        console.log("Deconectare CapacitorHttp reușită");
        logAPI("Deconectare CapacitorHttp reușită");
        return true;
      }
    } catch (capacitorError) {
      console.error("❌ CapacitorHttp logout failed:", capacitorError);
      logAPI(`Eroare deconectare CapacitorHttp: ${capacitorError}`);
    }

    console.log("Deconectarea a eșuat - continuarea oricum");
    logAPI("Deconectarea a eșuat - continuarea oricum");
    return false;
  } catch (error) {
    console.error("Eroare deconectare:", error);
    logAPI(`Eroare deconectare: ${error}`);
    return false;
  }
};

// UNIFIED GPS TRANSMISSION FUNCTION - handles both Android (string) and JS (object) input
(window as any).sendGPSViaCapacitor = async (
  gpsDataInput: any,
  token: string,
): Promise<boolean> => {
  try {
    if (!token || token.trim() === "") {
      console.error("❌ Transmisia GPS a eșuat: Nu a fost furnizat token Bearer");
      return false;
    }

    // Handle both string (from Android) and object (from JS) input
    let gpsData;
    if (typeof gpsDataInput === 'string') {
      gpsData = JSON.parse(gpsDataInput);
      console.log("📱 ANDROID BRIDGE → GPS data received as JSON string");
    } else {
      gpsData = gpsDataInput;
      console.log("🌐 JAVASCRIPT → GPS data received as object");
    }

    console.log("🚀 === UNIFIED GPS TRANSMISSION ===");
    console.log("📍 GPS Data Details:", {
      courseId: gpsData.uit,
      lat: gpsData.lat,
      lng: gpsData.lng,
      vehicle: gpsData.numar_inmatriculare,
      status: gpsData.status,
      timestamp: gpsData.timestamp,
      viteza: gpsData.viteza,
      directie: gpsData.directie,
      altitudine: gpsData.altitudine,
      baterie: gpsData.baterie,
      hdop: gpsData.hdop,
      gsm_signal: gpsData.gsm_signal
    });

    console.log("🔑 Using Bearer token:", token.substring(0, 20) + "...");
    console.log("🌐 Sending to URL:", `${API_BASE_URL}gps.php`);
    console.log("📤 Headers: Content-Type: application/json; charset=utf-8");

    const response = await CapacitorHttp.post({
      url: `${API_BASE_URL}gps.php`,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "User-Agent": "iTrack-Native/1.0",
      },
      data: gpsData,
    });

    console.log("📡 === RĂSPUNS GPS DETALIAT ===");
    console.log("📊 Cod status:", response.status);
    console.log("📥 Date răspuns:", response.data);
    console.log("📦 Anteturi răspuns:", response.headers || {});
    
    // Detailed response analysis
    if (response.data) {
      if (typeof response.data === 'string') {
        console.log("📄 Previzualizare răspuns:", response.data.substring(0, 300));
        console.log("📏 Lungime răspuns:", response.data.length);
      } else if (typeof response.data === 'object') {
        console.log("📋 Obiect răspuns:", JSON.stringify(response.data, null, 2));
      }
    }

    // Handle specific error codes
    if (response.status === 401) {
      console.error("❌ 401 NEAUTORIZAT - Token invalid sau expirat");
      logAPI(`GPS 401 NEAUTORIZAT - Cursă: ${gpsData.uit}`);
      return false;
    } else if (response.status === 403) {
      console.error("❌ 403 INTERZIS - Token admin restricționat");
      logAPI(`GPS 403 INTERZIS - Token admin - Cursă: ${gpsData.uit}`);
      return false;
    } else if (response.status === 415) {
      console.error("❌ 415 TIP MEDIA NESUPORTAT - Verificați anteturile");
      logAPI(`GPS 415 TIP MEDIA NESUPORTAT - Cursă: ${gpsData.uit}`);
      return false;
    }

    if (response.status >= 200 && response.status < 300) {
      console.log("✅ GPS transmis cu succes pentru cursa:", gpsData.uit, "- Status:", response.status);
      logAPI(`Transmisie GPS reușită - Cursă: ${gpsData.uit} - Status: ${response.status}`);
      return true;
    } else {
      console.error("❌ Transmisia GPS a eșuat cu statusul:", response.status);
      logAPI(`Transmisie GPS eșuată - Cursă: ${gpsData.uit} - Status: ${response.status}`);
      return false;
    }

  } catch (error) {
    console.error("❌ Eroare transmisie GPS:", error);
    if (error instanceof Error) {
      console.error("  Detalii eroare:", error.name, error.message);
    }
    logAPI(`Eroare transmisie GPS: ${error}`);
    return false;
  }
};

export const sendGPSData = async (
  gpsData: GPSData,
  token: string,
): Promise<boolean> => {
  try {
    console.log("Transmisie GPS către server...");

    // GPS transmission using login token
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      console.log("📡 Transmisie GPS către gps.php");
      console.log("🎯 URL cerere:", `${API_BASE_URL}gps.php`);
      console.log("Vehicul:", gpsData.numar_inmatriculare);
      console.log("UIT:", gpsData.uit);
      console.log("Status:", gpsData.status);
      console.log(
        "🚨 DATE GPS COMPLETE TRIMISE:",
        JSON.stringify(gpsData, null, 2),
      );

      // Silent token validation
      try {
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const expTime = payload.exp * 1000;
          const currentTime = Date.now();

          if (currentTime >= expTime) {
            console.log("Token expirat - returnez false");
            return false;
          }
        }
      } catch (e) {
        if (e instanceof Error && e.message === "TOKEN_EXPIRED") {
          throw e;
        }
      }

      const response = await CapacitorHttp.post({
        url: `${API_BASE_URL}gps.php`,
        headers,
        data: gpsData,
        webFetchExtra: {
          signal: AbortSignal.timeout(15000),
        },
      });

      console.log(`📡 Răspuns GPS: ${response.status}`);

      if (response.status === 200 || response.status === 204) {
        console.log("✅ Date GPS transmise cu succes");
        // SUCCESS: Server răspunde, suntem online
        return true;
      } else {
        console.error(`❌ GPS eșuat: ${response.status}`);
        console.error("Răspuns:", response.data);
        
        // BackgroundGPSService handles offline storage natively
        console.log('💾 BackgroundGPSService gestionează stocarea offline nativ');
        return false;
      }

      // If error, try with different data serialization
      if (response.status >= 400) {
        console.log("🔄 ÎNCERC SERIALIZARE ALTERNATIVĂ DATE...");
        console.log("Prima încercare a eșuat cu:", response.status);
        console.log("Date răspuns:", response.data);

        // Try with pre-stringified data (some servers expect this)
        const alternativeResponse = await CapacitorHttp.request({
          method: "POST",
          url: `${API_BASE_URL}gps.php`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: JSON.stringify(gpsData),
        });

        console.log("Status răspuns alternativ:", alternativeResponse.status);
        console.log("Date răspuns alternativ:", alternativeResponse.data);

        if (alternativeResponse.status < 400) {
          console.log("✅ Formatul alternativ a funcționat!");
          return (
            alternativeResponse.status >= 200 &&
            alternativeResponse.status < 300
          );
        }
      }
      logAPI(
        `Rezultat GPS CapacitorHttp: ${response.status} - ${JSON.stringify(response.data)}`,
      );

      if (response.status === 401) {
        console.log("GPS: Token expirat - returnez false");
        return false;
      }

      // SALVARE AUTOMATĂ OFFLINE pentru orice status care nu e 200/204
      console.error(`❌ GPS eșuat: ${response.status}`);
      console.error("Răspuns:", response.data);
      // BackgroundGPSService handles HTTP error reporting natively
      
      console.log('💾 Salvez coordonată offline - server nu răspunde cu succes');
      try {
        // BackgroundGPSService handles offline GPS storage natively
        // await offlineGPSService.saveCoordinate(gpsData, gpsData.uit, gpsData.numar_inmatriculare, token, gpsData.status);
      } catch (error) {
        console.error('❌ Eroare salvare offline:', error);
      }
      
      return false;
    } catch (capacitorError) {
      console.log("=== CapacitorHttp eșuat, încerc fetch ===");
      console.log("Eroare CapacitorHttp:", capacitorError);

      // SECONDARY: fetch fallback
      const response = await fetch(`${API_BASE_URL}gps.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "User-Agent": "iTrack-Android-Service/1.0",
        },
        body: JSON.stringify(gpsData),
      });

      console.log("=== Răspuns GPS Fetch ===");
      console.log("Status:", response.status);
      const responseText = await response.text();
      console.log("Text răspuns:", responseText);
      logAPI(`Răspuns GPS Fetch: ${response.status} - ${responseText}`);

      if (response.status === 401) {
        console.log("GPS fetch: Token expirat - returnez false");
        return false;
      }

      if (response.status === 200 || response.status === 201 || response.status === 204) {
        console.log("✅ Fetch GPS trimis cu succes");
        return true;
      } else {
        // SALVARE AUTOMATĂ OFFLINE pentru fetch fallback cu status != 200
        console.error(`❌ Fetch GPS eșuat: ${response.status}`);
        
        console.log('💾 Salvez coordonată offline - fetch fallback eșuat');
        try {
          // Activez salvarea offline cu offlineGPSService  
          await offlineGPSService.saveOfflineCoordinate(gpsData);
          console.log('✅ Coordonată salvată offline cu succes (fetch fallback)');
        } catch (error) {
          console.error('❌ Eroare salvare offline (fetch):', error);
        }
        return false;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === "TOKEN_EXPIRED") {
      console.log("Transmisie GPS: Token expirat - returnez false");
      return false;
    }

    console.error("Eroare transmisie GPS:", error);
    logAPI(`Eroare GPS: ${error}`);
    
    // SALVARE AUTOMATĂ OFFLINE pentru eroare completă de transmisie  
    console.log('💾 Salvez coordonată offline - eroare completă de transmisie');
    try {
      // Activez salvarea offline cu offlineGPSService
      await offlineGPSService.saveOfflineCoordinate(gpsData);
      console.log('✅ Coordonată salvată offline cu succes');
    } catch (offlineError) {
      console.error('❌ Eroare salvare offline (error catch):', offlineError);
    }
    return false;
  }
};

// Enhanced GPS Bridge initialization
export function initializeGPSBridge() {
  console.log("✅ GPS Bridge inițializat - serviciul Android pregătit pentru transmisia GPS");
  console.log("📡 BackgroundGPSService folosește logging direct - nu mai e nevoie de callback");
  console.log("🌐 window.sendGPSViaCapacitor disponibil pentru Android service");
}

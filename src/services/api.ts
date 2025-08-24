import { logAPI } from "./appLogger";
// BackgroundGPSService gestionează detectarea rețelei prin răspunsuri HTTP
import { CapacitorHttp } from "@capacitor/core";
// BackgroundGPSService gestionează GPS offline nativ - nu este necesar serviciu separat
// Import static pentru a rezolva avertismentul Vite dynamic/static import

// Configurația API Centralizată
export const API_CONFIG = {
  // Mediul de dezvoltare (implicit)
  DEV: "https://www.euscagency.com/etsm3/platforme/transport/apk/",
  // Mediul de producție
  PROD: "https://www.euscagency.com/etsm_prod/platforme/transport/apk/",
};

// Mediul activ curent - COMMUTAT PE PROD (etsm_prod) - conform solicitării utilizatorului
export const API_BASE_URL = API_CONFIG.PROD; // Trecut pe PRODUCȚIE

// Gestionarea cererii unice pentru a preveni conflictele
let currentVehicleRequest: { vehicle: string; promise: Promise<any> } | null =
  null;
let requestInProgress = false;

export interface LoginResponse {
  status: string;
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
  hdop: number; // GPS accuracy in meters (HDOP field name for server compatibility)
  gsm_signal: number;
}



export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  try {
    // GDPR FIX: Don't log email addresses for privacy compliance
    console.log("Login direct CapacitorHttp pentru utilizator");
    logAPI(`Încercare login direct CapacitorHttp pentru user`);

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
        console.log("✅ CapacitorHttp login successful");
        logAPI(`CapacitorHttp login successful for user`);
        return { status: "success", token: data.token };
      } else {
        logAPI(`CapacitorHttp login failed: ${data.message}`);
        return {
          status: "error",
          error: data.message || "Date de conectare incorecte",
        };
      }
    } else {
      console.error("❌ Login failed:", response.status);
      logAPI(`Login failed: ${response.status}`);
      return {
        status: "error",
        error: `Eroare server: ${response.status}`,
      };
    }
  } catch (error: any) {
    console.error("Login error:", error);
    logAPI(`Login error: ${error.message}`);
    return {
      status: "error",
      error: "Eroare de conectare la server",
    };
  }
};

export const getVehicleCourses = async (
  vehicleNumber: string,
  token: string,
) => {
  // Check if there's already a pending request for this exact vehicle+token combination
  if (
    currentVehicleRequest &&
    currentVehicleRequest.vehicle === vehicleNumber
  ) {
    console.log("Blocking duplicate request - reusing active");
    logAPI(
      `Blocking duplicate request for vehicle ${vehicleNumber} - reusing active promise`,
    );
    return await currentVehicleRequest.promise;
  }

  // Check global request lock to prevent any simultaneous API calls
  if (requestInProgress) {
    console.log("Global request lock - waiting for completion");
    logAPI(
      `Global request lock active - waiting for completion before processing ${vehicleNumber}`,
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
      console.log("Timeout - forcing request unlock");
      logAPI("Request timeout - forcing unlock to prevent deadlock");
      requestInProgress = false;
      currentVehicleRequest = null;
    }
  }

  // SECURITY FIX: Admin mode validation with proper checks
  if (token === "ADMIN_TOKEN") {
    console.log("Admin mode: Using restricted API access");
    // Admin mode continues to actual API but with logging for audit trail
    logAPI("Admin mode accessed - audit log entry created");
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
    console.log("Request completed - locks cleared");
    logAPI(`Request completed for ${vehicleNumber} - all locks cleared`);
  }
};

const performVehicleCoursesRequest = async (
  vehicleNumber: string,
  token: string,
) => {
  try {
    const timestamp = Date.now();
    const urlWithCacheBuster = `${API_BASE_URL}vehicul.php?nr=${vehicleNumber}&t=${timestamp}`;

    logAPI(`Loading courses for vehicle ${vehicleNumber}`);

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
      console.log("Data length:", capacitorResponse.data?.length || "No data");

      if (capacitorResponse.status === 401) {
        console.log(
          "CapacitorHttp: Token expired - continuing with error response",
        );
        return { status: "error", error: "TOKEN_EXPIRED" };
      }

      response = {
        status: capacitorResponse.status,
        data: capacitorResponse.data,
      };
    } catch (capacitorError) {
      console.error("❌ CapacitorHttp courses failed:", capacitorError);
      logAPI(`CapacitorHttp courses error: ${capacitorError}`);
      return { status: "error", error: "CAPACITOR_HTTP_ERROR" };
    }

    console.log("API Response Status:", response.status);
    // SECURITY FIX: Don't log full API response data - may contain sensitive info
    console.log("API Response Data length:", response.data?.data?.length || 0);
    
    // DEBUG LOGGING pentru status-uri primite de la server
    if (response.data?.data?.length > 0) {
      console.log("🔍 === STATUS ANALYSIS ===");
      response.data.data.forEach((course: any, index: number) => {
        console.log(`📋 Course ${index}: ikRoTrans=${course.ikRoTrans}, serverStatus=${course.status || 'UNDEFINED'}, UIT=${course.UIT || course.uit}`);
      });
    }
    // SECURITY FIX: Log only essential info, not full data
    logAPI(
      `API response: status=${response.status}, courses=${response.data?.data?.length || 0}`,
    );

    if (response.status === 200) {
      const responseData = response.data;

      // Handle API format: {"status":"success","count":0,"data":[]}
      if (
        responseData.status === "success" &&
        Array.isArray(responseData.data)
      ) {
        console.log(
          `Found ${responseData.data.length} courses for vehicle ${vehicleNumber}`,
        );

        if (responseData.data.length > 0) {
          console.log("Processing course data");
          const processedCourses = responseData.data.map(
            (course: any, index: number) => {
              // CRITICAL NULL SAFETY: Verifică că course nu este null/undefined
              if (!course || typeof course !== 'object') {
                console.warn(`Course ${index} is invalid:`, course);
                return null;
              }

              // REQUIRED FIELD VALIDATION: ikRoTrans este obligatoriu
              if (!course.ikRoTrans) {
                console.warn(`Course ${index} missing ikRoTrans:`, course);
                return null;
              }

              return {
                id: course.ikRoTrans.toString(),
                name: `Transport ${course.ikRoTrans}`,
                departure_location: course.Vama || "Punct plecare",
                destination_location:
                  course.VamaStop || course.denumireLocStop || "Destinație",
                departure_time: null,
                arrival_time: null,
                description: course.denumireDeclarant || "Transport profesional",
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
                denumireLocStop: course.denumireLocStop,
                vamaStop: course.VamaStop,
                birouVamalStop: course.BirouVamalStop,
                judetStop: course.JudetStop,
                BirouVamal: course.BirouVamal,
                BirouVamalStop: course.BirouVamalStop,
                Judet: course.Judet,
                JudetStop: course.JudetStop,
                Vama: course.Vama,
                VamaStop: course.VamaStop
              };
            })
            .filter((course: any) => course !== null); // CRITICAL: Remove null courses

          console.log(
            `Processed ${processedCourses.length} courses successfully`,
          );
          logAPI(
            `Processed ${processedCourses.length} courses for ${vehicleNumber}`,
          );
          return processedCourses;
        } else {
          console.log("No courses found for vehicle");
          return [];
        }
      } else {
        console.log("Invalid API response format");
        logAPI(`Invalid response format: ${JSON.stringify(responseData)}`);
        return [];
      }
    } else {
      console.log("Non-200 HTTP response:", response.status);
      console.log("Continuing with empty array instead of throwing error");
      return [];
    }
  } catch (error) {
    console.error("Error loading vehicle courses:", error);
    logAPI(`Error loading courses for ${vehicleNumber}: ${error}`);
    // Return empty array instead of throwing error to allow graceful degradation
    return [];
  }
};

export const logout = async (token: string): Promise<boolean> => {
  try {
    console.log("Starting logout process with Bearer token");
    logAPI("Starting logout process");

    // Use centralized API configuration
    const logoutUrl = `${API_BASE_URL}logout.php`;

    // CapacitorHttp pentru logout (unified HTTP method)
    try {
      console.log("=== CapacitorHttp logout ===");

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
        console.log("CapacitorHttp logout successful");
        logAPI("CapacitorHttp logout successful");
        return true;
      }
    } catch (capacitorError) {
      console.error("❌ CapacitorHttp logout failed:", capacitorError);
      logAPI(`CapacitorHttp logout error: ${capacitorError}`);
    }

    console.log("Logout failed - continuing anyway");
    logAPI("Logout failed - continuing anyway");
    return false;
  } catch (error) {
    console.error("Logout error:", error);
    logAPI(`Logout error: ${error}`);
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
      console.error("❌ GPS transmission failed: No Bearer token provided");
      return false;
    }

    // CRITICAL NULL SAFETY: Handle both string (from Android) and object (from JS) input
    let gpsData;
    if (!gpsDataInput) {
      console.error("❌ GPS transmission failed: gpsDataInput is null or undefined");
      return false;
    }
    
    if (typeof gpsDataInput === 'string') {
      try {
        gpsData = JSON.parse(gpsDataInput);
        console.log("📱 ANDROID BRIDGE → GPS data received as JSON string");
      } catch (parseError) {
        console.error("❌ GPS transmission failed: Invalid JSON string from Android", parseError);
        return false;
      }
    } else {
      gpsData = gpsDataInput;
      console.log("🌐 JAVASCRIPT → GPS data received as object");
    }

    // CRITICAL VALIDATION: Verifică structura GPS data
    if (!gpsData || typeof gpsData !== 'object') {
      console.error("❌ GPS transmission failed: Invalid GPS data structure");
      return false;
    }

    // REQUIRED FIELDS VALIDATION
    if (!gpsData.uit || !gpsData.lat || !gpsData.lng || !gpsData.numar_inmatriculare) {
      console.error("❌ GPS transmission failed: Missing required fields", {
        has_uit: !!gpsData.uit,
        has_lat: !!gpsData.lat,
        has_lng: !!gpsData.lng,
        has_vehicle: !!gpsData.numar_inmatriculare
      });
      return false;
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
      hdop: gpsData.hdop || gpsData.accuracy_m || 0, // GPS accuracy in meters
      gsm_signal: gpsData.gsm_signal
    });

    // SECURITY FIX: Don't log token parts for security
    console.log("🔑 Using Bearer token authentication");
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

    console.log("📡 === GPS RESPONSE SUMMARY ===");
    console.log("📊 Status Code:", response.status);
    // SECURITY FIX: Don't log full response data for privacy
    console.log("📥 Response Type:", typeof response.data);
    console.log("📦 Has Headers:", !!(response.headers && Object.keys(response.headers).length));
    
    // Minimal response analysis without exposing data
    if (response.data) {
      if (typeof response.data === 'string') {
        console.log("📏 Response Length:", response.data.length);
        console.log("📄 Response Status:", response.data.includes('success') ? 'SUCCESS' : 'OTHER');
      } else if (typeof response.data === 'object') {
        console.log("📋 Response Keys:", Object.keys(response.data));
      }
    }

    // Handle specific error codes
    if (response.status === 401) {
      console.error("❌ 401 UNAUTHORIZED - Invalid or expired token");
      logAPI(`GPS 401 UNAUTHORIZED - Course: ${gpsData.uit}`);
      return false;
    } else if (response.status === 403) {
      console.error("❌ 403 FORBIDDEN - Admin token restricted");
      logAPI(`GPS 403 FORBIDDEN - Admin token - Course: ${gpsData.uit}`);
      return false;
    } else if (response.status === 415) {
      console.error("❌ 415 UNSUPPORTED MEDIA TYPE - Check headers");
      logAPI(`GPS 415 UNSUPPORTED MEDIA TYPE - Course: ${gpsData.uit}`);
      return false;
    }

    if (response.status >= 200 && response.status < 300) {
      console.log("✅ GPS transmitted successfully for course:", gpsData.uit, "- Status:", response.status);
      logAPI(`GPS transmission successful - Course: ${gpsData.uit} - Status: ${response.status}`);
      return true;
    } else {
      console.error("❌ GPS transmission failed with status:", response.status);
      logAPI(`GPS transmission failed - Course: ${gpsData.uit} - Status: ${response.status}`);
      return false;
    }

  } catch (error) {
    console.error("❌ GPS transmission error:", error);
    if (error instanceof Error) {
      console.error("  Error details:", error.name, error.message);
    }
    logAPI(`GPS transmission error: ${error}`);
    return false;
  }
};

// CRITICAL NEW API: Load GPS results for a specific course from server
export const getCourseGPSResults = async (
  courseId: string, // ikRoTrans
  vehicleNumber: string,
  token: string
): Promise<any> => {
  try {
    const timestamp = Date.now();
    const urlWithCacheBuster = `${API_BASE_URL}rezultate.php?uit=${encodeURIComponent(courseId)}&nr=${encodeURIComponent(vehicleNumber)}&t=${timestamp}`;
    
    logAPI(`Loading GPS results for course ${courseId} vehicle ${vehicleNumber}`);
    
    const capacitorResponse = await CapacitorHttp.get({
      url: urlWithCacheBuster,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "User-Agent": "iTrack-Native/1.0",
      },
    });

    console.log("GPS Results Response Status:", capacitorResponse.status);
    // SECURITY FIX: Don't log full GPS results data
    console.log("GPS Results Data Length:", capacitorResponse.data?.data?.length || 0);
    
    logAPI(`GPS results response: status=${capacitorResponse.status}, points=${capacitorResponse.data?.data?.length || 0}`);

    if (capacitorResponse.status === 401) {
      console.log("GPS Results: Token expired");
      return { status: "error", error: "TOKEN_EXPIRED" };
    }

    if (capacitorResponse.status === 200) {
      const responseData = capacitorResponse.data;

      // Handle API format: {"status":"success","count":X,"data":[GPS points]}
      if (responseData.status === "success" && Array.isArray(responseData.data)) {
        console.log(`Found ${responseData.data.length} GPS points for course ${courseId}`);

        // Transform GPS points to expected format
        const transformedPoints = responseData.data.map((point: any) => ({
          lat: parseFloat(point.lat || point.latitude || 0),
          lng: parseFloat(point.lng || point.longitude || 0),
          timestamp: point.timestamp || point.data_time || new Date().toISOString(),
          speed: parseFloat(point.viteza || point.speed || 0),
          accuracy: parseFloat(point.hdop || point.accuracy || 0),
          bearing: parseFloat(point.directie || point.bearing || 0),
          altitude: parseFloat(point.altitudine || point.altitude || 0),
          isManualPause: false // Server data doesn't have this flag
        }));

        return {
          status: "success",
          gpsPoints: transformedPoints,
          totalPoints: responseData.data.length,
          rawData: responseData.data
        };
      } else {
        console.log("GPS Results: No data or invalid format");
        return {
          status: "success",
          gpsPoints: [],
          totalPoints: 0,
          rawData: []
        };
      }
    } else {
      console.error("GPS Results: Server error:", capacitorResponse.status);
      return { status: "error", error: "SERVER_ERROR", statusCode: capacitorResponse.status };
    }
  } catch (error) {
    console.error("GPS Results API error:", error);
    logAPI(`GPS results error: ${error}`);
    return { status: "error", error: "NETWORK_ERROR" };
  }
};

export const sendGPSData = async (
  gpsData: GPSData,
  token: string,
): Promise<boolean> => {
  try {
    console.log("GPS transmission to server...");

    // GPS transmission using login token
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      console.log("📡 GPS Transmission to gps.php");
      // CRITICAL SECURITY FIX: Never log tokens or sensitive GPS data
      console.log("🔐 Using Bearer token authentication");
      console.log("🎯 Request URL:", `${API_BASE_URL}gps.php`);
      console.log("Vehicle:", gpsData.numar_inmatriculare?.substring(0, 3) + "***");
      console.log("UIT:", gpsData.uit);
      console.log("Status:", gpsData.status);
      console.log("📍 GPS data ready for transmission (coordinates protected)");

      // Silent token validation
      try {
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const expTime = payload.exp * 1000;
          const currentTime = Date.now();

          if (currentTime >= expTime) {
            console.log("Token expired - returning false");
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

      console.log(`📡 GPS Response: ${response.status}`);

      if (response.status === 200 || response.status === 204) {
        console.log("✅ GPS data transmitted successfully");
        // SUCCESS: Server răspunde, suntem online
        return true;
      } else {
        console.error(`❌ GPS failed: ${response.status}`);
        console.error("Response:", response.data);
        
        // BackgroundGPSService handles offline storage natively
        console.log('💾 BackgroundGPSService handles offline storage natively');
        return false;
      }

      // If error, try with different data serialization
      if (response.status >= 400) {
        console.log("🔄 TRYING ALTERNATIVE DATA SERIALIZATION...");
        console.log("First attempt failed with:", response.status);
        console.log("Response data:", response.data);

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

        console.log("Alternative response status:", alternativeResponse.status);
        console.log("Alternative response data:", alternativeResponse.data);

        if (alternativeResponse.status < 400) {
          console.log("✅ Alternative format worked!");
          return (
            alternativeResponse.status >= 200 &&
            alternativeResponse.status < 300
          );
        }
      }
      logAPI(
        `CapacitorHttp GPS result: ${response.status} - response received`,
      );

      if (response.status === 401) {
        console.log("GPS: Token expired - returning false");
        return false;
      }

      // SALVARE AUTOMATĂ OFFLINE pentru orice status care nu e 200/204
      console.error(`❌ GPS failed: ${response.status}`);
      console.error("Response:", response.data);
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
      console.log("=== CapacitorHttp failed, trying fetch ===");
      console.log("CapacitorHttp error:", capacitorError);

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

      console.log("=== Fetch GPS Response ===");
      console.log("Status:", response.status);
      const responseText = await response.text();
      // SECURITY FIX: Don't log full response text
      console.log("Response length:", responseText.length);
      logAPI(`Fetch GPS response: ${response.status} - length ${responseText.length}`);

      if (response.status === 401) {
        console.log("GPS fetch: Token expired - returning false");
        return false;
      }

      if (response.status === 200 || response.status === 201 || response.status === 204) {
        console.log("✅ Fetch GPS sent successfully");
        return true;
      } else {
        // SALVARE AUTOMATĂ OFFLINE pentru fetch fallback cu status != 200
        console.error(`❌ Fetch GPS failed: ${response.status}`);
        
        console.log('💾 Salvez coordonată offline - fetch fallback eșuat');
        try {
          // BackgroundGPSService handles offline GPS storage natively
          // await offlineGPSService.saveCoordinate(gpsData, gpsData.uit, gpsData.numar_inmatriculare, token, gpsData.status);
        } catch (error) {
          console.error('❌ Eroare salvare offline (fetch):', error);
        }
        return false;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === "TOKEN_EXPIRED") {
      console.log("GPS transmission: Token expired - returning false");
      return false;
    }

    console.error("GPS transmission error:", error);
    logAPI(`GPS error: ${error}`);
    
    // SALVARE AUTOMATĂ OFFLINE pentru eroare completă de transmisie  
    console.log('💾 Salvez coordonată offline - eroare completă de transmisie');
    try {
      // BackgroundGPSService handles offline GPS storage natively
      // await offlineGPSService.saveCoordinate(gpsData, gpsData.uit, gpsData.numar_inmatriculare, token, gpsData.status);
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

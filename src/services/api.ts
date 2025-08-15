import { logAPI } from "./appLogger";
import { CapacitorHttp } from "@capacitor/core";
// Consistent static import to resolve Vite warnings

// Centralized API Configuration
export const API_CONFIG = {
  // Main environment
  MAIN: "https://www.euscagency.com/etsm3/platforme/transport/apk/",
};

// Current active environment
export const API_BASE_URL = API_CONFIG.MAIN; // Sincronizat cu Android pentru consistență

// Single request management to prevent conflicts
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

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  try {
    console.log("Direct CapacitorHttp login for:", email);
    logAPI(`Direct CapacitorHttp login attempt for ${email}`);

    // Use CapacitorHttp directly for fast authentication
    try {
      console.log("Using CapacitorHttp for fast login");

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
          console.log("CapacitorHttp login successful");
          logAPI(`CapacitorHttp login successful for ${email}`);
          return { status: "success", token: data.token };
        } else {
          logAPI(`CapacitorHttp login failed: ${data.message}`);
          return {
            status: "error",
            error: data.message || "Date de conectare incorecte",
          };
        }
      }
    } catch (capacitorError) {
      console.log(
        "CapacitorHttp not available, trying fallback:",
        capacitorError,
      );
    }

    // Browser/fetch fallback for development
    try {
      const response = await fetch(`${API_BASE_URL}login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Accept: "application/json",
          "User-Agent": "iTrack-Browser/1.0",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        logAPI(
          `Login HTTP error ${response.status} - continuing with fallback`,
        );
        // Continue to fallback method
      } else {
        try {
          const data = await response.json();

          if (data.status === "success" && data.token) {
            logAPI(`Browser login successful for ${email}`);
            return { status: "success", token: data.token };
          } else {
            logAPI(`Browser login failed: ${data.message}`);
            return {
              status: "error",
              error: data.message || "Date de conectare incorecte",
            };
          }
        } catch (parseError) {
          logAPI(`JSON parse error - continuing with fallback`);
        }
      }
    } catch (error: any) {
      logAPI(`Browser login error: ${error.message}`);
      return { status: "error", error: "Eroare de conexiune la server" };
    }

    // If both CapacitorHttp and fetch failed
    return { status: "error", error: "Eroare de conexiune la server" };
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

  // Admin mode - use actual API but with admin token
  if (token === "ADMIN_TOKEN") {
    console.log("Admin mode: Using actual API data");
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
      console.log("=== CapacitorHttp failed, trying fetch ===");
      console.log("CapacitorHttp error:", capacitorError);

      // SECONDARY: fetch fallback pentru browser
      console.log("=== TRYING fetch for courses ===");

      const fetchResponse = await fetch(urlWithCacheBuster, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      console.log("=== Fetch Courses Response ===");
      console.log("Status:", fetchResponse.status);
      console.log("OK:", fetchResponse.ok);

      if (fetchResponse.status === 401) {
        console.log("Fetch: Token expired - continuing with error response");
        return { status: "error", error: "TOKEN_EXPIRED" };
      }

      if (!fetchResponse.ok) {
        console.log(
          `Fetch: HTTP error ${fetchResponse.status} - continuing with error response`,
        );
        return { status: "error", error: `HTTP_ERROR_${fetchResponse.status}` };
      }

      response = {
        status: fetchResponse.status,
        data: await fetchResponse.json(),
      };
    }

    console.log("API Response Status:", response.status);
    console.log("API Response Data:", JSON.stringify(response.data, null, 2));
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
          `Found ${responseData.data.length} courses for vehicle ${vehicleNumber}`,
        );

        if (responseData.data.length > 0) {
          console.log("Processing course data");
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
              status: 1,
              uit: course.UIT,
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
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: {},
      });

      if (response.status >= 200 && response.status < 300) {
        console.log("CapacitorHttp logout successful");
        logAPI("CapacitorHttp logout successful");
        return true;
      }
    } catch (capacitorError) {
      console.log("CapacitorHttp logout failed, using fetch fallback");

      try {
        const fetchResponse = await fetch(logoutUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });

        if (fetchResponse.status >= 200 && fetchResponse.status < 300) {
          console.log("Fetch logout successful");
          logAPI("Fetch logout successful");
          return true;
        }
      } catch (fetchError) {
        console.error("All logout methods failed:", fetchError);
      }
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

// Global function for Android GPS service to use CapacitorHttp
(window as any).sendGPSViaCapacitor = async (
  jsonString: string,
  token: string,
) => {
  try {
    if (!token || token.trim() === "") {
      console.error("Transmisia GPS a eșuat: Nu s-a furnizat Bearer token");
      return false;
    }

    const gpsData = JSON.parse(jsonString);
    console.log("GPS de la serviciul Android:", {
      courseId: gpsData.uit,
      lat: gpsData.lat,
      lng: gpsData.lng,
      vehicle: gpsData.numar_inmatriculare,
      status: gpsData.status,
    });

    console.log("Using Bearer token:", token.substring(0, 20) + "...");
    console.log("Sending to URL:", `${API_BASE_URL}gps.php`);

    try {
      const response = await CapacitorHttp.post({
        url: `${API_BASE_URL}gps.php`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "User-Agent": "iTrack-Android-Service/1.0",
        },
        data: gpsData,
      });

      console.log("=== ANDROID CapacitorHttp GPS Response ===");
      console.log("Status:", response.status);
      console.log("Data:", response.data);

      if (response.status === 401) {
        console.error("❌ 401 NEAUTORIZAT - Token GPS Android respins");
        console.error("Token complet folosit:", `Bearer ${token}`);
        console.error("URL cerere:", `${API_BASE_URL}gps.php`);
        return false;
      } else if (response.status === 403) {
        console.error(
          "❌ 403 FORBIDDEN - Server restricts GPS for admin/test tokens",
        );
        console.error(
          "⚠️ ADMIN TOKEN DETECTED - Production server blocks GPS transmission for security",
        );
        console.error(
          "💾 Coordinate saved offline - will auto-sync with real user token",
        );
        console.error("Token type: ADMIN/TEST (+40722222222)");
        logAPI(
          `403 FORBIDDEN - Admin token GPS restricted - courseId: ${gpsData.uit}`,
        );
        return false;
      }

      if (response.status >= 200 && response.status < 300) {
        console.log(
          "GPS transmis cu succes prin CapacitorHttp pentru cursa",
          gpsData.uit,
        );
        return true;
      }

      console.error("Serverul GPS a respins datele:", response.status);
      return false;
    } catch (capacitorError: any) {
      console.error(
        "CapacitorHttp failed, trying fallback fetch:",
        capacitorError.message,
      );

      const fallbackResponse = await fetch(`${API_BASE_URL}gps.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(gpsData),
        signal: AbortSignal.timeout(8000),
      });

      if (fallbackResponse.ok) {
        console.log("GPS sent via fallback fetch");
        return true;
      }

      console.error("Fallback fetch failed:", fallbackResponse.status);
      return false;
    }
  } catch (error: any) {
    console.error("Android GPS transmission error:", error.message);
    return false;
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
      console.log("🔐 FULL TOKEN BEING SENT:", `Bearer ${token}`);
      console.log("🎯 Request URL:", `${API_BASE_URL}gps.php`);
      console.log("Vehicle:", gpsData.numar_inmatriculare);
      console.log("UIT:", gpsData.uit);
      console.log("Status:", gpsData.status);
      console.log(
        "🚨 COMPLETE GPS DATA BEING SENT:",
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
        return true;
      } else {
        console.error(`❌ GPS failed: ${response.status}`);
        console.error("Response:", response.data);
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
        `CapacitorHttp GPS result: ${response.status} - ${JSON.stringify(response.data)}`,
      );

      if (response.status === 401) {
        console.log("GPS: Token expired - returning false");
        return false;
      }

      return (
        response.status === 200 ||
        response.status === 201 ||
        response.status === 204
      );
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
      console.log("Response text:", responseText);
      logAPI(`Fetch GPS response: ${response.status} - ${responseText}`);

      if (response.status === 401) {
        console.log("GPS fetch: Token expired - returning false");
        return false;
      }

      return (
        response.status === 200 ||
        response.status === 201 ||
        response.status === 204
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message === "TOKEN_EXPIRED") {
      console.log("GPS transmission: Token expired - returning false");
      return false;
    }

    console.error("GPS transmission error:", error);
    logAPI(`GPS error: ${error}`);
    return false;
  }
};

// Global function for OptimalGPSService to send GPS via CapacitorHttp
(window as any).sendGPSViaCapacitor = async (
  gpsData: any,
  token: string,
): Promise<boolean> => {
  try {
    console.log("🚀 OptimalGPSService → CapacitorHttp GPS transmission");
    logAPI(`OptimalGPSService GPS via CapacitorHttp: ${gpsData.uit}`);

    const response = await CapacitorHttp.post({
      url: `${API_BASE_URL}gps.php`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "iTrack-Optimal-GPS/1.0",
      },
      data: gpsData,
    });

    if (response.status >= 200 && response.status < 300) {
      console.log(
        "✅ OptimalGPSService GPS sent successfully via CapacitorHttp",
      );
      logAPI(`OptimalGPSService GPS success: ${response.status}`);
      return true;
    } else {
      console.error("❌ OptimalGPSService GPS failed:", response.status);
      logAPI(`OptimalGPSService GPS failed: ${response.status}`);
      return false;
    }
  } catch (error: any) {
    console.error("❌ OptimalGPSService GPS error:", error.message);
    logAPI(`OptimalGPSService GPS error: ${error.message}`);
    return false;
  }
};

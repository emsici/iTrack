import { logAPI } from './appLogger';
// Using only native HTTP in APK, fetch in browser - CapacitorHttp completely removed

export const API_BASE_URL = 'https://www.euscagency.com/etsm3/platforme/transport/apk';

// Single request management to prevent conflicts
let currentVehicleRequest: { vehicle: string; promise: Promise<any> } | null = null;
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
  status: string;
  hdop: string;
  gsm_signal: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    console.log('Login attempt for:', email);
    logAPI(`Login attempt for ${email}`);
    
    // Try native HTTP first if available (APK mode)
    if (typeof (window as any).AndroidGPS?.postNativeHttp === 'function') {
      console.log('Using native HTTP for login');
      const nativeResult = (window as any).AndroidGPS.postNativeHttp(
        `${API_BASE_URL}/login.php`,
        JSON.stringify({ email, password }),
        ''
      );
      
      if (nativeResult.startsWith('SUCCESS:')) {
        const responseBody = nativeResult.substring(8);
        const response = JSON.parse(responseBody);
        
        if (response.token) {
          return { status: 'success', token: response.token };
        } else if (response.error) {
          throw new Error(response.error);
        }
      }
      
      throw new Error('Native login failed');
    } else {
      // Browser fallback - use fetch
      console.log('Using fetch for login (browser mode)');
      
      const response = await fetch(`${API_BASE_URL}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        return { status: 'success', token: data.token };
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Autentificare eșuată');
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    logAPI(`Login error: ${error}`);
    throw new Error('Eroare de conexiune la serverul de autentificare');
  }
};

export const getVehicleCourses = async (vehicleNumber: string, token: string) => {
  // Check if there's already a pending request for this exact vehicle+token combination
  if (currentVehicleRequest && currentVehicleRequest.vehicle === vehicleNumber) {
    console.log('Blocking duplicate request - reusing active');
    logAPI(`Blocking duplicate request for vehicle ${vehicleNumber} - reusing active promise`);
    return await currentVehicleRequest.promise;
  }
  
  // Check global request lock to prevent any simultaneous API calls
  if (requestInProgress) {
    console.log('Global request lock - waiting for completion');
    logAPI(`Global request lock active - waiting for completion before processing ${vehicleNumber}`);
    
    // Wait for current request to complete with timeout protection
    let waitCount = 0;
    while (requestInProgress && waitCount < 50) { // Max 5 seconds wait
      await new Promise(resolve => setTimeout(resolve, 100));
      waitCount++;
    }
    
    // If still locked after timeout, force unlock
    if (requestInProgress) {
      console.log('Timeout - forcing request unlock');
      logAPI('Request timeout - forcing unlock to prevent deadlock');
      requestInProgress = false;
      currentVehicleRequest = null;
    }
  }
  
  // Admin mode - use actual API but with admin token
  if (token === 'ADMIN_TOKEN') {
    console.log('Admin mode: Using actual API data');
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
    console.log('Request completed - locks cleared');
    logAPI(`Request completed for ${vehicleNumber} - all locks cleared`);
  }
};

const performVehicleCoursesRequest = async (vehicleNumber: string, token: string) => {
  try {
    const timestamp = Date.now();
    const urlWithCacheBuster = `${API_BASE_URL}/vehicul.php?nr=${vehicleNumber}&t=${timestamp}`;
    
    console.log(`Loading courses for vehicle: ${vehicleNumber}`);
    logAPI(`Loading courses for vehicle ${vehicleNumber}`);
    
    // Try native HTTP first - PURE JAVA EFFICIENCY
    let response;
    if (typeof (window as any).AndroidGPS?.getNativeHttp === 'function') {
      console.log('Using native HTTP for vehicle courses');
      const nativeResult = (window as any).AndroidGPS.getNativeHttp(
        urlWithCacheBuster,
        token
      );
      
      if (nativeResult.startsWith('SUCCESS:')) {
        const responseBody = nativeResult.substring(8);
        response = { status: 200, data: JSON.parse(responseBody) };
      } else if (nativeResult.includes('401')) {
        throw new Error('TOKEN_EXPIRED');
      } else {
        throw new Error('Native HTTP error');
      }
    } else {
      // Browser fallback - use fetch
      console.log('Using fetch for courses (browser mode)');
      
      const fetchResponse = await fetch(urlWithCacheBuster, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (fetchResponse.status === 401) {
        throw new Error('TOKEN_EXPIRED');
      }
      
      if (!fetchResponse.ok) {
        throw new Error(`HTTP ${fetchResponse.status}`);
      }
      
      response = { status: fetchResponse.status, data: await fetchResponse.json() };
    }

    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(response.data, null, 2));
    logAPI(`API response: status=${response.status}, data=${JSON.stringify(response.data)}`);

    if (response.status === 200) {
      const responseData = response.data;
      
      // Handle API format: {"status":"success","count":0,"data":[]}
      if (responseData.status === 'success' && Array.isArray(responseData.data)) {
        console.log(`Found ${responseData.data.length} courses for vehicle ${vehicleNumber}`);
        
        if (responseData.data.length > 0) {
          console.log('Processing course data');
          const processedCourses = responseData.data.map((course: any, index: number) => ({
            id: course.ikRoTrans?.toString() || `course_${index}`,
            name: `Transport ${course.ikRoTrans}`,
            departure_location: course.Vama || 'Punct plecare',
            destination_location: course.VamaStop || course.denumireLocStop || 'Destinație',
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
            VamaStop: course.VamaStop
          }));
          
          console.log(`Processed ${processedCourses.length} courses successfully`);
          logAPI(`Processed ${processedCourses.length} courses for ${vehicleNumber}`);
          return processedCourses;
        } else {
          console.log('No courses found for vehicle');
          return [];
        }
      } else {
        console.log('Invalid API response format');
        logAPI(`Invalid response format: ${JSON.stringify(responseData)}`);
        return [];
      }
    } else {
      console.log('Non-200 HTTP response:', response.status);
      throw new Error(`Server error: ${response.status}`);
    }
  } catch (error) {
    console.error('Error loading vehicle courses:', error);
    logAPI(`Error loading courses for ${vehicleNumber}: ${error}`);
    throw new Error('Eroare de conexiune la serverul de curse');
  }
};

export const logout = async (token: string): Promise<boolean> => {
  try {
    console.log('Starting logout process with Bearer token');
    logAPI('Starting logout process');
    
    // Try native HTTP first - PURE JAVA EFFICIENCY
    let response;
    if (typeof (window as any).AndroidGPS?.postNativeHttp === 'function') {
      console.log('Using native HTTP for logout');
      const nativeResult = (window as any).AndroidGPS.postNativeHttp(
        `${API_BASE_URL}/logout.php`,
        '{}',
        token
      );
      
      if (nativeResult.startsWith('SUCCESS')) {
        return true;
      } else {
        return false;
      }
    } else {
      // Browser fallback - use fetch
      console.log('Using fetch for logout (browser mode)');
      
      const fetchResponse = await fetch(`${API_BASE_URL}/logout.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: '{}'
      });
      
      return fetchResponse.ok;
    }
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

export const sendGPSData = async (gpsData: GPSData, token: string): Promise<boolean> => {
  try {
    console.log('GPS Request Details');
    console.log('URL:', `${API_BASE_URL}/gps.php`);
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('GPS Data:', JSON.stringify(gpsData, null, 2));
    
    // Try native GPS first - PURE JAVA EFFICIENCY
    if (typeof (window as any).AndroidGPS?.sendGPSNative === 'function') {
      console.log('Using native GPS transmission');
      const nativeResult = (window as any).AndroidGPS.sendGPSNative(
        gpsData.lat.toString(),
        gpsData.lng.toString(),
        gpsData.viteza.toString(),
        gpsData.directie.toString(),
        gpsData.altitudine.toString(),
        gpsData.baterie.toString(),
        gpsData.numar_inmatriculare,
        gpsData.uit,
        gpsData.status,
        gpsData.hdop,
        gpsData.gsm_signal,
        token
      );
      
      console.log('Native GPS result:', nativeResult);
      logAPI(`Native GPS result: ${nativeResult}`);
      
      if (nativeResult.includes('401')) {
        throw new Error('TOKEN_EXPIRED');
      }
      
      return nativeResult.includes('SUCCESS') || nativeResult.includes('200');
    } else {
      // Browser fallback - use fetch
      console.log('Using fetch for GPS (browser mode)');
      
      const response = await fetch(`${API_BASE_URL}/gps.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gpsData)
      });

      console.log('GPS response status:', response.status);
      logAPI(`GPS HTTP response: ${response.status}`);
      
      if (response.status === 401) {
        throw new Error('TOKEN_EXPIRED');
      }
      
      return response.status === 200 || response.status === 204;
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
      throw error;
    }
    
    console.error('GPS transmission error:', error);
    logAPI(`GPS error: ${error}`);
    return false;
  }
};
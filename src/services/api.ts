import { CapacitorHttp, Capacitor } from '@capacitor/core';
import { logAPI } from './appLogger';
// Native HTTP functionality available for Android APK

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
    // Native HTTP available in Android APK
    if (typeof window !== 'undefined' && (window as any).AndroidGPS?.postNativeHttp) {
      console.log('Using native HTTP for login');
      const responseStr = (window as any).AndroidGPS.postNativeHttp(
        `${API_BASE_URL}/login.php`,
        JSON.stringify({ email, password }),
        ''
      );
      return JSON.parse(responseStr);
    }
    
    let response;
    
    if (Capacitor.isNativePlatform()) {
      // Use CapacitorHttp for native platforms
      response = await CapacitorHttp.post({
        url: `${API_BASE_URL}/login.php`,
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          email,
          password
        }
      });
      
      if (response.status === 200) {
        const data = response.data;
        if (data.status === 'success' && data.token) {
          return { status: data.status, token: data.token };
        } else {
          throw new Error('Autentificare eșuată');
        }
      } else {
        throw new Error('Autentificare eșuată');
      }
    } else {
      // For web environment, the API server needs CORS configured
      // Use CapacitorHttp for web platforms
      const response = await CapacitorHttp.post({
        url: `${API_BASE_URL}/login.php`,
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          email,
          password
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = response.data;
      if (data.status === 'success' && data.token) {
        return { status: data.status, token: data.token };
      } else {
        throw new Error('Autentificare eșuată');
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    throw new Error('Eroare de conexiune la serverul de autentificare');
  }
};

export const getVehicleCourses = async (vehicleNumber: string, token: string) => {
  // Check if there's already a pending request for this exact vehicle+token combination
  if (currentVehicleRequest && currentVehicleRequest.vehicle === vehicleNumber) {
    console.log('=== BLOCKING DUPLICATE REQUEST - REUSING ACTIVE ===');
    logAPI(`BLOCKING duplicate request for vehicle ${vehicleNumber} - reusing active promise`);
    return await currentVehicleRequest.promise;
  }
  
  // Check global request lock to prevent any simultaneous API calls
  if (requestInProgress) {
    console.log('=== GLOBAL REQUEST LOCK - WAITING FOR COMPLETION ===');
    logAPI(`Global request lock active - waiting for completion before processing ${vehicleNumber}`);
    
    // Wait for current request to complete with timeout protection
    let waitCount = 0;
    while (requestInProgress && waitCount < 50) { // Max 5 seconds wait
      await new Promise(resolve => setTimeout(resolve, 100));
      waitCount++;
    }
    
    // If still locked after timeout, force unlock
    if (requestInProgress) {
      console.log('=== TIMEOUT - FORCING REQUEST UNLOCK ===');
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
    console.log('=== REQUEST COMPLETED - LOCKS CLEARED ===');
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
      console.log('🔥 Using native HTTP for vehicle courses');
      const nativeResult = (window as any).AndroidGPS.getNativeHttp(
        urlWithCacheBuster,
        token
      );
      response = { status: 200, data: JSON.parse(nativeResult) };
    } else {
      // Fallback to CapacitorHttp only in browser
      response = await CapacitorHttp.get({
        url: urlWithCacheBuster,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
    }

    console.log('=== APK DEBUG: API Response Status ===', response.status);
    console.log('=== APK DEBUG: API Response Data ===', JSON.stringify(response.data, null, 2));
    logAPI(`APK DEBUG: API response: status=${response.status}, data=${JSON.stringify(response.data)}`);

    if (response.status === 200) {
      const responseData = response.data;
      
      // Handle API format: {"status":"success","count":0,"data":[]}
      if (responseData.status === 'success' && Array.isArray(responseData.data)) {
        console.log(`=== APK DEBUG: Found ${responseData.data.length} courses for vehicle ${vehicleNumber} ===`);
        
        if (responseData.data.length > 0) {
          console.log('=== APK DEBUG: Processing course data ===');
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
            denumireLocStop: course.denumireLocStop
          }));
          
          console.log('=== APK DEBUG: About to return processed courses ===', processedCourses.length);
          logAPI(`APK DEBUG: Processed ${processedCourses.length} courses successfully`);
          return processedCourses;
        } else {
          console.log('=== APK DEBUG: No courses found for this vehicle ===');
          logAPI(`APK DEBUG: No courses available for vehicle ${vehicleNumber}`);
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
    console.log('Logout: Starting logout process with Bearer token');
    logAPI('Starting logout process');
    
    // Try native HTTP first - PURE JAVA EFFICIENCY
    let response;
    if (typeof (window as any).AndroidGPS?.postNativeHttp === 'function') {
      console.log('🔥 Using native HTTP for logout');
      const nativeResult = (window as any).AndroidGPS.postNativeHttp(
        `${API_BASE_URL}/logout.php`,
        '{}',
        token
      );
      response = { status: 200, data: JSON.parse(nativeResult) };
    } else {
      // Fallback to CapacitorHttp only in browser
      response = await CapacitorHttp.post({
        url: `${API_BASE_URL}/logout.php`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: {}
      });
    }

    console.log('Logout response status:', response.status);
    logAPI(`Logout response: ${response.status}`);
    
    return response.status === 200 || response.status === 204;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

export const sendGPSData = async (gpsData: GPSData, token: string): Promise<boolean> => {
  try {
    console.log('=== GPS REQUEST DETAILS ===');
    console.log('URL:', `${API_BASE_URL}/gps.php`);
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('GPS Data:', JSON.stringify(gpsData, null, 2));
    
    // Try native HTTP first - PURE JAVA EFFICIENCY
    let response;
    if (typeof (window as any).AndroidGPS?.postNativeHttp === 'function') {
      console.log('🔥 Using native HTTP for GPS data');
      const nativeResult = (window as any).AndroidGPS.postNativeHttp(
        `${API_BASE_URL}/gps.php`,
        JSON.stringify(gpsData),
        token
      );
      response = { status: 200, data: JSON.parse(nativeResult) };
    } else {
      // Fallback to CapacitorHttp only in browser
      response = await CapacitorHttp.post({
        url: `${API_BASE_URL}/gps.php`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: gpsData
      });
    }

    console.log('=== GPS RESPONSE DETAILS ===');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
    if (response.status === 200 || response.status === 201 || response.status === 204) {
      console.log('✅ GPS data sent successfully for UIT:', gpsData.uit);
      return true;
    } else if (response.status === 401) {
      console.error('❌ Unauthorized - Token expired');
      throw new Error('Token expired - please login again');
    } else {
      console.error('❌ GPS request failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ GPS transmission error:', error);
    return false;
  }
};

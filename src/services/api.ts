import { CapacitorHttp, Capacitor } from '@capacitor/core';
import { logAPI } from './appLogger';

const API_BASE_URL = 'https://www.euscagency.com/etsm3/platforme/transport/apk';

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
      // Try using fetch with proper headers
      const fetchResponse = await fetch(`${API_BASE_URL}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      });
      
      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }
      
      const data = await fetchResponse.json();
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
    // Add cache busting timestamp to prevent server cache issues
    const timestamp = Date.now();
    const urlWithCacheBuster = `${API_BASE_URL}/vehicul.php?nr=${vehicleNumber}&t=${timestamp}`;
    
    console.log('=== VEHICLE COURSES REQUEST ===');
    console.log('URL:', urlWithCacheBuster);
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('Cache Buster:', timestamp);
    
    logAPI(`Vehicle courses request for ${vehicleNumber} with cache buster ${timestamp}`);
    
    const response = await CapacitorHttp.get({
      url: urlWithCacheBuster,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    console.log('=== VEHICLE COURSES RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('Response Type:', typeof response.data);
    console.log('Response Keys:', Object.keys(response.data || {}));
    
    logAPI(`Initial response: status=${response.status}, type=${typeof response.data}, keys=[${Object.keys(response.data || {}).join(',')}]`);
    logAPI(`Response data: ${JSON.stringify(response.data).substring(0, 200)}...`);

    if (response.status === 200) {
      const responseData = response.data;
      console.log('Response Data Status:', responseData.status);
      console.log('Response Data Array Check:', Array.isArray(responseData.data));
      console.log('Response Data Length:', responseData.data?.length);
      console.log('Status check:', responseData.status === 'success');
      console.log('Array check:', Array.isArray(responseData.data));
      console.log('Length check:', responseData.data && responseData.data.length > 0);
      
      logAPI(`Validation: status=${responseData.status}, isArray=${Array.isArray(responseData.data)}, length=${responseData.data?.length}`);
      
      // Check if we have valid data - status success and data array
      if (responseData.status === 'success' && Array.isArray(responseData.data) && responseData.data.length > 0) {
        console.log('=== VALIDATION PASSED - PROCESSING DATA ===');
        logAPI(`Validation passed - processing ${responseData.data.length} courses`);
        return responseData.data.map((course: any, index: number) => ({
          id: course.ikRoTrans?.toString() || `course_${index}`,
          name: `ikRoTrans: ${course.ikRoTrans}`,
          departure_location: course.denumireLocStart || course.Vama,
          destination_location: course.denumireLocStop || course.VamaStop,
          departure_time: course.dataTransport || null,
          arrival_time: null,
          description: course.denumireDeclarant,
          status: 1,
          uit: course.UIT,
          // Toate datele originale din API pentru detalii complete
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
          // Keep original API field names as well
          BirouVamal: course.BirouVamal,
          BirouVamalStop: course.BirouVamalStop,
          denumireLocStop: course.denumireLocStop
        }));
      } else if (Array.isArray(responseData) && responseData.length > 0) {
        // Handle case where response is directly an array (some HTTP clients do this)
        console.log('Processing direct array response');
        return responseData.map((course: any, index: number) => ({
          id: course.ikRoTrans?.toString() || `course_${index}`,
          name: `ikRoTrans: ${course.ikRoTrans}`,
          departure_location: course.denumireLocStart || course.Vama,
          destination_location: course.denumireLocStop || course.VamaStop,
          departure_time: course.dataTransport || null,
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
      } else {
        console.log('=== VALIDATION FAILED - DETAILED ANALYSIS ===');
        console.log('Failed conditions:');
        console.log('  - status === "success":', responseData.status === 'success', `(actual: "${responseData.status}")`);
        console.log('  - Array.isArray(data):', Array.isArray(responseData.data), `(actual type: ${typeof responseData.data})`);
        console.log('  - data.length > 0:', responseData.data?.length > 0, `(actual length: ${responseData.data?.length})`);
        console.log('Full response structure:', JSON.stringify(responseData, null, 2));
        
        logAPI(`VALIDATION FAILED: status="${responseData.status}", isArray=${Array.isArray(responseData.data)}, length=${responseData.data?.length}`);
        logAPI(`No data in initial response for ${vehicleNumber} - attempting retry in 1 second`);
        
        // Retry once more with a small delay to handle server cache issues
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const retryTimestamp = Date.now();
        const retryResponse = await CapacitorHttp.get({
          url: `${API_BASE_URL}/vehicul.php?nr=${vehicleNumber}&_retry=${retryTimestamp}`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        console.log('=== RETRY RESPONSE ===');
        console.log('Retry Status:', retryResponse.status);
        console.log('Retry Data:', JSON.stringify(retryResponse.data, null, 2));
        
        logAPI(`Retry response: status=${retryResponse.status}, data=${JSON.stringify(retryResponse.data)}`);
        
        if (retryResponse.status === 200 && retryResponse.data?.status === 'success' && 
            Array.isArray(retryResponse.data.data) && retryResponse.data.data.length > 0) {
          console.log('Retry successful - processing data');
          return retryResponse.data.data.map((course: any, index: number) => ({
            id: course.ikRoTrans?.toString() || `course_${index}`,
            name: `ikRoTrans: ${course.ikRoTrans}`,
            departure_location: course.denumireLocStart || course.Vama,
            destination_location: course.denumireLocStop || course.VamaStop,
            departure_time: course.dataTransport || null,
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
        } else {
          console.log('Retry also failed - no courses available for this vehicle');
          return [];
        }
      }
    } else {
      throw new Error('Eroare la încărcarea curselor');
    }
  } catch (error) {
    console.error('Get vehicle courses error:', error);
    throw new Error('Eroare de conexiune la serverul de curse');
  }
};

export const logout = async (token: string): Promise<boolean> => {
  try {
    let response;
    
    if (Capacitor.isNativePlatform()) {
      // Use CapacitorHttp for native platforms
      response = await CapacitorHttp.post({
        url: `${API_BASE_URL}/login.php`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: {
          iesire: 1
        }
      });
    } else {
      // Use fetch for web platforms
      response = await fetch(`${API_BASE_URL}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          iesire: 1
        })
      });
    }
    
    return response.status === 200;
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
    
    const response = await CapacitorHttp.post({
      url: `${API_BASE_URL}/gps.php`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: gpsData
    });

    console.log('=== GPS RESPONSE DETAILS ===');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
    if (response.status === 200) {
      console.log('✅ GPS data sent successfully for UIT:', gpsData.uit);
      return true;
    } else {
      console.error('❌ GPS request failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ GPS transmission error:', error);
    return false;
  }
};

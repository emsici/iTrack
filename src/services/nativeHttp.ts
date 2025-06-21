/**
 * Native HTTP Service for Android
 * Uses pure Java HttpURLConnection instead of web-based requests
 * Completely bypasses any CORS or web-related issues
 */

declare global {
  interface Window {
    AndroidGPS?: {
      sendGPSNative: (lat: string, lng: string, speed: string, direction: string, 
                     altitude: string, battery: string, vehicleNumber: string, 
                     uit: string, status: string, hdop: string, gsmSignal: string, 
                     authToken: string) => string;
      postNativeHttp: (url: string, jsonData: string, authToken: string) => string;
      getNativeHttp: (url: string, authToken: string) => string;
    };
  }
}

export const API_BASE_URL = 'https://www.euscagency.com/etsm3/platforme/transport/apk';

/**
 * Native HTTP POST request
 */
export const nativeHttpPost = async (endpoint: string, data: any, token: string): Promise<any> => {
  if (!window.AndroidGPS?.postNativeHttp) {
    throw new Error('Native HTTP not available - running in browser mode');
  }
  
  const url = `${API_BASE_URL}${endpoint}`;
  const jsonData = JSON.stringify(data);
  
  console.log('📤 Native HTTP POST:', url);
  
  const result = window.AndroidGPS.postNativeHttp(url, jsonData, token);
  
  if (result.startsWith('SUCCESS:')) {
    const responseBody = result.substring(8); // Remove "SUCCESS:" prefix
    try {
      return JSON.parse(responseBody);
    } catch (e) {
      return { success: true, data: responseBody };
    }
  } else if (result.startsWith('ERROR:')) {
    const error = result.substring(6); // Remove "ERROR:" prefix
    throw new Error(`Native HTTP error: ${error}`);
  } else {
    throw new Error(`Unexpected native HTTP response: ${result}`);
  }
};

/**
 * Native HTTP GET request
 */
export const nativeHttpGet = async (endpoint: string, token: string): Promise<any> => {
  if (!window.AndroidGPS?.getNativeHttp) {
    throw new Error('Native HTTP not available - running in browser mode');
  }
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log('📤 Native HTTP GET:', url);
  
  const result = window.AndroidGPS.getNativeHttp(url, token);
  
  if (result.startsWith('SUCCESS:')) {
    const responseBody = result.substring(8); // Remove "SUCCESS:" prefix
    try {
      return JSON.parse(responseBody);
    } catch (e) {
      return { success: true, data: responseBody };
    }
  } else if (result.startsWith('ERROR:')) {
    const error = result.substring(6); // Remove "ERROR:" prefix
    throw new Error(`Native HTTP error: ${error}`);
  } else {
    throw new Error(`Unexpected native HTTP response: ${result}`);
  }
};

/**
 * Send GPS data using native HTTP
 */
export const sendGPSNative = async (gpsData: {
  lat: number;
  lng: number;
  speed: number;
  direction: number;
  altitude: number;
  battery: number;
  vehicleNumber: string;
  uit: string;
  status: number;
  hdop: string;
  gsmSignal: string;
}, token: string): Promise<boolean> => {
  if (!window.AndroidGPS?.sendGPSNative) {
    console.log('Native GPS not available - using fallback method');
    return false;
  }
  
  console.log('📤 Native GPS transmission:', gpsData);
  
  const result = window.AndroidGPS.sendGPSNative(
    gpsData.lat.toString(),
    gpsData.lng.toString(),
    gpsData.speed.toString(),
    gpsData.direction.toString(),
    gpsData.altitude.toString(),
    gpsData.battery.toString(),
    gpsData.vehicleNumber,
    gpsData.uit,
    gpsData.status.toString(),
    gpsData.hdop,
    gpsData.gsmSignal,
    token
  );
  
  return result.startsWith('SUCCESS');
};

/**
 * Check if native HTTP is available
 */
export const isNativeHttpAvailable = (): boolean => {
  return !!(window.AndroidGPS?.postNativeHttp && window.AndroidGPS?.getNativeHttp);
};

/**
 * Login using native HTTP
 */
export const loginNative = async (email: string, password: string): Promise<any> => {
  return nativeHttpPost('/login.php', { email, password }, '');
};

/**
 * Get vehicle courses using native HTTP
 */
export const getVehicleCoursesNative = async (vehicleNumber: string, token: string): Promise<any> => {
  return nativeHttpGet(`/get_courses_by_vehicle.php?vehicle=${vehicleNumber}`, token);
};

/**
 * Logout using native HTTP
 */
export const logoutNative = async (token: string): Promise<any> => {
  return nativeHttpPost('/logout.php', {}, token);
};
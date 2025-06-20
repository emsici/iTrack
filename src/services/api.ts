import { CapacitorHttp, Capacitor } from '@capacitor/core';

const API_BASE_URL = 'https://www.euscagency.com/etsm3/platforme/transport/apk';

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
  try {
    console.log('=== VEHICLE COURSES REQUEST ===');
    console.log('URL:', `${API_BASE_URL}/vehicul.php?nr=${vehicleNumber}`);
    console.log('Token:', token.substring(0, 20) + '...');
    
    const response = await CapacitorHttp.get({
      url: `${API_BASE_URL}/vehicul.php?nr=${vehicleNumber}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('=== VEHICLE COURSES RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      const responseData = response.data;
      console.log('Response Data Status:', responseData.status);
      console.log('Response Data Array Check:', Array.isArray(responseData.data));
      console.log('Response Data Length:', responseData.data?.length);
      
      // Check if we have valid data - either direct array or success with data array
      if (responseData.status === 'success' && Array.isArray(responseData.data) && responseData.data.length > 0) {
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
        console.log('No valid data found in response');
        return [];
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

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
  status: number; // 2=active, 3=pause, 4=stop
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
    const response = await CapacitorHttp.get({
      url: `${API_BASE_URL}/vehicul.php?nr=${vehicleNumber}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.status === 200) {
      const responseData = response.data;
      if (responseData.status === 'success' && Array.isArray(responseData.data)) {
        return responseData.data.map((course: any, index: number) => ({
          id: course.ikRoTrans?.toString() || `course_${index}`,
          name: `Transport ${course.denumireLocStart || 'Start'} → ${course.denumireLocStop || 'Stop'}`,
          departure_location: course.denumireLocStart || course.Judet,
          destination_location: course.denumireLocStop || course.JudetStop,
          departure_time: course.dataTransport,
          arrival_time: null,
          description: `${course.denumireCui || ''} - ${course.nrVehicul || ''}`,
          status: 1, // Always start as available
          uit: course.UIT
        }));
      } else {
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

export const sendGPSData = async (gpsData: GPSData, token: string): Promise<boolean> => {
  try {
    const response = await CapacitorHttp.post({
      url: `${API_BASE_URL}/gps.php`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: gpsData
    });

    return response.status === 200;
  } catch (error) {
    console.error('Send GPS data error:', error);
    return false;
  }
};

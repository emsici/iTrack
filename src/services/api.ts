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
          name: `Transport ${course.codDeclarant} - ${course.ikRoTrans}`,
          departure_location: `${course.denumireLocStart || course.Vama}, ${course.Judet || ''}`.trim().replace(/, $/, ''),
          destination_location: `${course.denumireLocStop || course.VamaStop}, ${course.JudetStop || ''}`.trim().replace(/, $/, ''),
          departure_time: course.dataTransport || null,
          arrival_time: null,
          description: course.denumireDeclarant || 'Transport marfă',
          status: 1,
          uit: course.UIT,
          // Păstrarea tuturor datelor originale pentru detalii complete
          ikRoTrans: course.ikRoTrans,
          codDeclarant: course.codDeclarant,
          denumireDeclarant: course.denumireDeclarant,
          nrVehicul: course.nrVehicul,
          dataTransport: course.dataTransport,
          vama: course.Vama,
          birouVamal: course.BirouVamal,
          judet: course.Judet,
          vamaStop: course.VamaStop,
          birouVamalStop: course.BirouVamalStop,
          judetStop: course.JudetStop
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

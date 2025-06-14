import { CapacitorHttp } from '@capacitor/core';

const API_BASE_URL = 'https://www.euscagency.com/etsm3/platforme/transport/apk';

export interface LoginResponse {
  bearer?: string;
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

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Autentificare eșuată');
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
      // Parse the response data and ensure it's in the expected format
      const data = response.data;
      if (Array.isArray(data)) {
        return data.map((course: any, index: number) => ({
          id: course.id || `course_${index}`,
          name: course.name || course.nume || `Cursă ${index + 1}`,
          departure_location: course.departure_location || course.plecare,
          destination_location: course.destination_location || course.destinatie,
          departure_time: course.departure_time || course.ora_plecare,
          arrival_time: course.arrival_time || course.ora_sosire,
          description: course.description || course.descriere,
          status: course.status || 1,
          uit: course.uit || `UIT${Math.random().toString(36).substr(2, 5)}`
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

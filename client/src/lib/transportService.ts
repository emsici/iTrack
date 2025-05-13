import { GpsDataPayload } from "@shared/schema";
import { apiRequest } from "./queryClient";

export const sendGpsData = async (data: GpsDataPayload, token: string) => {
  const response = await apiRequest(
    "POST",
    "https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php",
    data
  );
  
  return await response.json();
};

export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });
};

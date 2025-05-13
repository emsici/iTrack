import { GpsDataPayload } from "@shared/schema";
import { apiRequest } from "./queryClient";

export const sendGpsUpdate = async (
  position: GeolocationPosition, 
  vehicleNumber: string, 
  uitNumber: string, 
  batteryLevel: number,
  token: string
) => {
  try {
    const { latitude, longitude, altitude } = position.coords;
    const speed = position.coords.speed ? position.coords.speed * 3.6 : 0; // Convert m/s to km/h
    const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
    
    const gpsData: GpsDataPayload = {
      lat: latitude,
      lng: longitude,
      timestamp,
      viteza: speed,
      directie: 0, // We don't have a way to get direction, so set to 0
      altitudine: altitude || 0,
      baterie: Math.round(batteryLevel),
      numar_inmatriculare: vehicleNumber,
      uit: uitNumber
    };
    
    const response = await apiRequest(
      "POST",
      "https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php",
      gpsData
    );
    
    return {
      success: response.ok,
      data: gpsData,
      response
    };
  } catch (error) {
    console.error("Error sending GPS update:", error);
    throw error;
  }
};

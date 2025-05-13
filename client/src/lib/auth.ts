import { Login } from "@shared/schema";
import { apiRequest } from "./queryClient";

export const loginUser = async (credentials: Login) => {
  const response = await apiRequest(
    "POST",
    "https://www.euscagency.com/etsm3/platforme/transport/apk/login.php",
    credentials
  );
  
  return await response.json();
};

export const getVehicleInfo = async (registrationNumber: string, token: string) => {
  const response = await fetch(
    `https://www.euscagency.com/etsm3/platforme/transport/apk/vehicul.php?nr=${registrationNumber}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to get vehicle info: ${response.statusText}`);
  }
  
  return await response.json();
};

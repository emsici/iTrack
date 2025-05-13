import { Login } from "@shared/schema";
import { apiRequest } from "./queryClient";

export const loginUser = async (credentials: Login) => {
  try {
    console.log("Încercare autentificare cu email:", credentials.email);
    
    // În mediul de dezvoltare, folosim proxy-ul local
    const apiUrl = import.meta.env.DEV 
      ? "/api/login" 
      : "https://www.euscagency.com/etsm3/platforme/transport/apk/login.php";
    
    // Construim payload-ul exact cum este în Postman
    const payload = JSON.stringify({
      email: credentials.email,
      password: credentials.password
    });
    
    console.log("Payload autentificare:", payload);
    
    // Facem cererea fără Content-Type, exact ca în Postman
    const response = await fetch(apiUrl, {
      method: "POST",
      body: payload
    });
    
    if (!response.ok) {
      console.error("Eroare răspuns API autentificare:", response.status, response.statusText);
      return {
        success: false,
        message: "Eroare de server la autentificare"
      };
    }
    
    const data = await response.json();
    console.log("Răspuns API autentificare:", data);
    
    if (data.status === "success" && data.token) {
      // Autentificare reușită
      return {
        success: true,
        token: data.token,
        user: { email: credentials.email }
      };
    } else {
      // Autentificare eșuată
      return {
        success: false,
        message: data.message || "Credențiale invalide"
      };
    }
  } catch (error) {
    console.error("Eroare la autentificare:", error);
    return {
      success: false,
      message: "Eroare de rețea la autentificare"
    };
  }
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

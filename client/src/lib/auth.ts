import { Login } from "@shared/schema";
import { apiRequest } from "./queryClient";

export const loginUser = async (credentials: Login) => {
  try {
    console.log("Încercare autentificare cu email:", credentials.email);
    
    // Determinăm dacă suntem în mediul nativ (Android/iOS) sau în browser
    const isNative = (window as any).Capacitor?.isNativePlatform?.() || false;
    
    // În aplicația nativă folosim URL-ul direct, în browser folosim proxy-ul
    const apiUrl = isNative
      ? "https://www.euscagency.com/etsm3/platforme/transport/apk/login.php"
      : "/api/login";
    
    console.log("Folosim URL API:", apiUrl, "isNative:", isNative);
    
    // Construim payload-ul exact cum este în Postman
    const payload = JSON.stringify({
      email: credentials.email,
      password: credentials.password
    });
    
    console.log("Payload autentificare:", payload);
    
    // Pentru aplicația nativă, trimitem cererea fără Content-Type
    // În browser, folosim standardul JSON
    const requestOptions: RequestInit = {
      method: "POST",
      body: payload
    };
    
    // În browser adăugăm header-ul Content-Type pentru a funcționa cu express
    if (!isNative) {
      requestOptions.headers = {
        "Content-Type": "application/json"
      };
    }
    
    const response = await fetch(apiUrl, requestOptions);
    
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

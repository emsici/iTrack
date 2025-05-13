import { Login } from "@shared/schema";
import { apiRequest } from "./queryClient";

export const loginUser = async (credentials: Login) => {
  try {
    console.log("Încercare autentificare cu email:", credentials.email);
    
    // Determinăm dacă suntem în mediul nativ (Android/iOS) sau în browser
    const isNative = (window as any).Capacitor?.isNativePlatform?.() || false;
    
    // Verificăm dacă suntem în mod dezvoltare
    const isLocalDev = !!import.meta.env.DEV;
    
    // În aplicația nativă folosim URL-ul corespunzător, în browser folosim proxy-ul
    let apiUrl;
    if (isNative && isLocalDev) {
      // Aplicație nativă în dezvoltare - folosește serverul Replit
      apiUrl = "https://813298f8-355d-45c8-a208-8d8351cf88a4-00-2axpe8ckrdbyo.riker.replit.dev/api/login";
    } else if (isNative && !isLocalDev) {
      // Aplicație nativă în producție - folosește API-ul direct
      apiUrl = "https://www.euscagency.com/etsm3/platforme/transport/apk/login.php";
    } else {
      // Browser - folosim întotdeauna proxy-ul
      apiUrl = "/api/login";
    }
    
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
  try {
    // Determinăm dacă suntem în mediul nativ (Android/iOS) sau în browser
    const isNative = (window as any).Capacitor?.isNativePlatform?.() || false;
    // Verificăm dacă suntem în mod dezvoltare
    const isLocalDev = !!import.meta.env.DEV;
    
    // Alegem URL-ul în funcție de mediu
    let apiUrl;
    if (isNative && isLocalDev) {
      // Aplicație nativă în dezvoltare - folosește serverul Replit
      apiUrl = `https://813298f8-355d-45c8-a208-8d8351cf88a4-00-2axpe8ckrdbyo.riker.replit.dev/api/vehicle?nr=${registrationNumber}`;
    } else if (isNative && !isLocalDev) {
      // Aplicație nativă în producție - folosește API-ul direct
      apiUrl = `https://www.euscagency.com/etsm3/platforme/transport/apk/vehicul.php?nr=${registrationNumber}`;
    } else {
      // Browser - folosim întotdeauna proxy-ul
      apiUrl = `/api/vehicle?nr=${registrationNumber}`;
    }
    
    console.log("Folosim URL API pentru vehicul:", apiUrl);
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get vehicle info: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Eroare la obținerea informațiilor vehiculului:", error);
    throw error;
  }
};

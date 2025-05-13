import { Login } from "@shared/schema";
import { apiRequest } from "./queryClient";
import { Http } from '@capacitor-community/http';
import { Capacitor } from '@capacitor/core';

// Helper pentru a verifica dacă suntem pe dispozitiv nativ
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const loginUser = async (credentials: Login) => {
  try {
    console.log("Încercare autentificare cu email:", credentials.email);
    
    // Determinăm dacă suntem în mediul nativ (Android/iOS) sau în browser
    const isNative = Capacitor.isNativePlatform();
    
    console.log("Suntem pe dispozitiv nativ:", isNative);
    
    // Construim payload-ul exact cum este în Postman
    const payload = {
      email: credentials.email,
      password: credentials.password
    };
    
    console.log("Payload autentificare:", payload);
    
    // URL-ul API extern
    const apiExternUrl = "https://www.euscagency.com/etsm3/platforme/transport/apk/login.php";
    
    if (isNative) {
      // Pe dispozitiv nativ folosim plugin-ul @capacitor-community/http pentru a evita problemele CORS
      console.log("Folosim Capacitor HTTP plugin pentru login");
      
      try {
        const httpResponse = await Http.request({
          method: 'POST',
          url: apiExternUrl,
          data: payload,
          // Nu specificăm headers de tipul Content-Type conform cerințelor API-ului
        });
        
        console.log("Status răspuns Capacitor HTTP:", httpResponse.status);
        console.log("Răspuns date:", JSON.stringify(httpResponse.data));
        
        if (httpResponse.status >= 200 && httpResponse.status < 300) {
          // Simulăm un răspuns standard
          return {
            success: true,
            ...httpResponse.data
          };
        } else {
          console.error("Eroare răspuns API login: ", httpResponse.status);
          return {
            success: false,
            message: `Eroare server: ${httpResponse.status}`
          };
        }
      } catch (capacitorError) {
        console.error("Eroare plugin Capacitor HTTP:", capacitorError);
        return {
          success: false,
          message: "Eroare de rețea: " + (capacitorError as Error).message
        };
      }
    } else {
      // În browser, folosim proxy-ul
      const apiUrl = "/api/login";
      console.log("Folosim URL API (browser):", apiUrl);
      
      // În browser, adăugăm header-ul Content-Type pentru a funcționa cu express
      const requestOptions: RequestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      };
      
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
    const isNative = Capacitor.isNativePlatform();
    
    // URL-ul API extern
    const apiExternUrl = `https://www.euscagency.com/etsm3/platforme/transport/apk/vehicul.php?nr=${registrationNumber}`;
    
    if (isNative) {
      // Pe dispozitiv nativ folosim plugin-ul @capacitor-community/http pentru a evita problemele CORS
      console.log("Folosim Capacitor HTTP plugin pentru informații vehicul:", apiExternUrl);
      
      try {
        const httpResponse = await Http.request({
          method: 'GET',
          url: apiExternUrl,
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        console.log("Status răspuns Capacitor HTTP (vehicul):", httpResponse.status);
        console.log("Răspuns date vehicul:", JSON.stringify(httpResponse.data));
        
        if (httpResponse.status >= 200 && httpResponse.status < 300) {
          return httpResponse.data;
        } else {
          throw new Error(`Eroare la obținerea informațiilor vehiculului: ${httpResponse.status}`);
        }
      } catch (capacitorError) {
        console.error("Eroare plugin Capacitor HTTP (vehicul):", capacitorError);
        throw capacitorError;
      }
    } else {
      // În browser, folosim proxy-ul
      const apiUrl = `/api/vehicle?nr=${registrationNumber}`;
      console.log("Folosim URL API pentru vehicul (browser):", apiUrl);
      
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
    }
  } catch (error) {
    console.error("Eroare la obținerea informațiilor vehiculului:", error);
    throw error;
  }
};

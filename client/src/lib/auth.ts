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
    console.log("Date de autentificare trimise:", credentials);
    console.log("Încercare de autentificare cu:", credentials);
    
    // Determinăm dacă suntem în mediul nativ (Android/iOS) sau în browser
    const isNative = Capacitor.isNativePlatform();
    
    // URL-ul API diferă între native și browser
    const apiUrl = isNative 
      ? "https://www.euscagency.com/etsm3/platforme/transport/apk/login.php" 
      : "/api/login";
      
    console.log("Folosim URL API:", apiUrl, "isNative:", isNative);
    
    // Construim payload-ul de autentificare
    const payload = {
      email: credentials.email,
      password: credentials.password
    };
    
    let responseData;
    
    // Diferențiem între browser și dispozitiv nativ pentru metoda de request
    if (isNative) {
      try {
        // Folosim HTTP plugin de la Capacitor pentru dispozitive native
        const response = await Http.request({
          method: 'POST',
          url: apiUrl,
          data: payload,
          params: {}, // Obiect params gol pentru a evita NullPointerException
          headers: {
            // Nu specificăm Content-Type pentru a fi conform cu cerințele API-ului
          }
        });
        
        console.log("Răspuns login dispozitiv nativ:", response.status, response.data);
        
        if (response.status >= 200 && response.status < 300) {
          responseData = response.data;
        } else {
          throw new Error(`Server returned status ${response.status}`);
        }
      } catch (error) {
        console.error("Eroare HTTP pe dispozitiv nativ:", error);
        throw error;
      }
    } else {
      // Pentru browser folosim fetch API standard
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      };
      
      const response = await fetch(apiUrl, requestOptions);
      
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      
      responseData = await response.json();
    }
    
    // Procesăm răspunsul uniform, indiferent de platformă
    console.log("Răspuns autentificare:", responseData);
    
    // Verificăm dacă autentificarea a fost reușită
    if (responseData && (responseData.status === "success" || responseData.token)) {
      console.log("Rezultat autentificare:", true);
      return {
        success: true,
        token: responseData.token,
        user: { email: credentials.email }
      };
    } else {
      console.log("Rezultat autentificare:", false);
      return {
        success: false,
        message: responseData?.message || "Credențiale invalide"
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
    console.log("Cerere informații vehicul:", registrationNumber);
    console.log("Token autorizare:", `Bearer ${token}`);
    
    // Determinăm dacă suntem în mediul nativ (Android/iOS) sau în browser
    const isNative = Capacitor.isNativePlatform();
    
    // URL-ul API diferă între native și browser
    const apiUrl = isNative 
      ? `https://www.euscagency.com/etsm3/platforme/transport/apk/vehicul.php?nr=${registrationNumber}`
      : `/api/vehicle?nr=${registrationNumber}`;
    
    let responseData;
    
    // Diferențiem între browser și dispozitiv nativ pentru metoda de request
    if (isNative) {
      try {
        // Folosim HTTP plugin de la Capacitor pentru dispozitive native
        // Verificăm dacă suntem pe Android pentru a seta explicit params
        const response = await Http.request({
          method: 'GET',
          url: apiUrl,
          headers: {
            "Authorization": `Bearer ${token}`
          },
          params: {}, // Obiect params gol pentru a evita NullPointerException
          data: {} // Adăugăm și data gol pentru a evita probleme
        });
        
        console.log("Răspuns informații vehicul (native):", response.status, response.data);
        
        if (response.status >= 200 && response.status < 300) {
          responseData = response.data;
        } else {
          throw new Error(`Server returned status ${response.status}`);
        }
      } catch (error) {
        console.error("Eroare HTTP pe dispozitiv nativ (vehicul):", error);
        throw error;
      }
    } else {
      // Pentru browser folosim fetch API standard
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      
      responseData = await response.json();
      console.log("Răspuns informații vehicul (browser):", responseData);
    }
    
    // Returnăm datele vehiculului
    return responseData;
  } catch (error) {
    console.error("Eroare la obținerea informațiilor vehiculului:", error);
    throw error;
  }
};

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
    // Folosim URL-ul exact furnizat de client pentru API extern
    const apiUrl = isNative 
      ? "https://www.euscagency.com/etsm3/platforme/transport/apk/login.php" 
      : "/api/login";
    console.log("URL autentificare:", apiUrl);
      
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
        // IMPORTANT: API-ul extern așteaptă formular URL-encoded, nu JSON
        const formData = new URLSearchParams();
        formData.append('email', credentials.email);
        formData.append('password', credentials.password);
        
        console.log("Trimit date de autentificare în format form-urlencoded:", formData.toString());
        
        const response = await Http.request({
          method: 'POST',
          url: apiUrl,
          data: formData.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          params: {} as any // FOARTE IMPORTANT: obiect gol transformat în any pentru a rezolva problema de tipuri
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
    
    // Verificăm dacă autentificarea a fost reușită și tratăm diferit răspunsul în funcție de platformă
    console.log("Rezultat autentificare:", responseData, apiUrl);
    
    if (isNative) {
      // Pentru API extern: verificăm strict formatul de răspuns așteptat
      // Depanare avansată pentru răspunsul API-ului
      console.log("RĂSPUNS RAW API EXTERN:", typeof responseData, JSON.stringify(responseData));
      
      // API-ul poate returna un string cu token-ul direct sau un obiect cu proprietatea token
      if ((typeof responseData === 'string' && responseData.length > 10) || 
          (responseData && responseData.token)) {
        
        // Dacă răspunsul este string direct, îl folosim ca token
        const tokenValue = typeof responseData === 'string' ? responseData : responseData.token;
        console.log("Rezultat autentificare API extern:", true, "Token:", tokenValue);
        return {
          success: true,
          token: tokenValue,
          user: { email: credentials.email }
        };
      } else {
        console.log("Rezultat autentificare API extern:", false, apiUrl);
        return {
          success: false,
          message: responseData?.message || "Credențiale invalide"
        };
      }
    } else {
      // Pentru API intern (dezvoltare): verificăm formatul de răspuns specific
      if (responseData && (responseData.status === "success" || responseData.token)) {
        console.log("Rezultat autentificare API intern:", true);
        return {
          success: true,
          token: responseData.token,
          user: { email: credentials.email }
        };
      } else {
        console.log("Rezultat autentificare API intern:", false);
        return {
          success: false,
          message: responseData?.message || "Credențiale invalide"
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
        // Fixăm NullPointerException setând explicit params și data ca null
        const response = await Http.request({
          method: 'GET',
          url: apiUrl,
          headers: {
            // IMPORTANT: Păstrăm formatul original, exact ce vine după login
            "Authorization": token.startsWith("Bearer ") ? token : `Bearer ${token}`
          },
          params: {} as any, // FOARTE IMPORTANT: obiect gol transformat în any pentru a rezolva problema de tipuri
          data: {} as any  // FOARTE IMPORTANT: obiect gol transformat în any pentru a evita NullPointerException
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

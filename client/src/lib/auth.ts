import { Login } from "@shared/schema";
import { apiRequest } from "./queryClient";
import { Http } from '@capacitor-community/http';
import { Capacitor } from '@capacitor/core';

/**
 * Decodează un token JWT și returnează payload-ul
 * @param token Token JWT
 * @returns Payload decodat sau null dacă tokenul este invalid
 */
export const decodeToken = (token: string): any | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Eroare la decodarea token-ului:", error);
    return null;
  }
};

/**
 * Verifică dacă un token JWT este expirat
 * @param token Token JWT
 * @returns true dacă tokenul este expirat, false altfel
 */
export const isTokenExpired = (token: string): boolean => {
  if (!token) return true;
  
  try {
    const payload = decodeToken(token);
    if (!payload || !payload.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime > payload.exp;
  } catch (error) {
    console.error("Eroare la verificarea expirării token-ului:", error);
    return true;
  }
};

/**
 * Verifică validitatea unui token JWT
 * @param token Token JWT
 * @returns true dacă tokenul este valid, false altfel
 */
export const isValidToken = (token: string): boolean => {
  if (!token) return false;
  
  // Verifică dacă tokenul are formatul corect (header.payload.signature)
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) return false;
  
  // Verifică dacă tokenul este expirat
  return !isTokenExpired(token);
};

// Helper pentru a verifica dacă suntem pe dispozitiv nativ
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const loginUser = async (credentials: Login) => {
  try {
    // Verificare specială pentru utilizatorul admin (pagina de loguri)
    if (credentials.email === 'admin@itrack.app' && credentials.password === 'admin123') {
      console.log("Credențiale admin detectate - nu se face apel la API");
      return {
        success: false,
        message: "Credențiale admin - autentificarea se face local"
      };
    }
    
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
    
    console.log("Payload autentificare:", JSON.stringify(payload));
    
    let responseData;
    
    // Diferențiem între browser și dispozitiv nativ pentru metoda de request
    if (isNative) {
      try {
        // Folosim HTTP plugin de la Capacitor pentru dispozitive native
        // API-ul extern așteaptă JSON în exact formatul din Postman
        // Formatul exact din exemplu: {"email":"test@exemplu.com", "password":"parola123"}
        
        // Construim JSON exact în formatul așteptat
        const jsonData = JSON.stringify({
          "email": credentials.email,
          "password": credentials.password
        });
        
        console.log("Trimit date de autentificare în format JSON EXACT:", jsonData);
        
        const response = await Http.request({
          method: 'POST',
          url: apiUrl,
          data: jsonData, // Trimitem string JSON deja formatat
          headers: {
            'Content-Type': 'application/json'
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
      // Conform exemplului de la client, răspunsul are format:
      // { "status": "success", "token": "..." }
      if (responseData && 
          ((responseData.status === "success" && responseData.token) ||
           (typeof responseData === 'string' && responseData.length > 10))) {
        
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
    
    // Procesăm răspunsul conform noii structuri JSON
    console.log("=== RĂSPUNS RAW API VEHICUL ===");
    console.log("Status:", responseData?.status);
    console.log("Count:", responseData?.count);
    console.log("Data array:", responseData?.data);
    console.log("Întreg răspunsul:", JSON.stringify(responseData, null, 2));
    
    // Verificăm dacă avem răspuns cu noua structură: { status, count, data }
    if (responseData && responseData.status === "success" && responseData.data && Array.isArray(responseData.data)) {
      // Luăm primul vehicul din array (dacă există)
      if (responseData.data.length > 0) {
        const vehicleData = responseData.data[0];
        
        // Mapăm noile proprietăți la structura așteptată de aplicație
        const mappedVehicleData = {
          nr: vehicleData.nrVehicul || registrationNumber,
          uit: vehicleData.UIT || vehicleData.uit,
          start_locatie: vehicleData.denumireLocStart || "Locație start",
          stop_locatie: vehicleData.denumireLocStop || "Locație destinație", 
          codDeclarant: vehicleData.codDeclarant,
          denumireCui: vehicleData.denumireCui,
          dataTransport: vehicleData.dataTransport,
          ikRoTrans: vehicleData.ikRoTrans
        };
        
        console.log("Date vehicul procesate:", mappedVehicleData);
        return mappedVehicleData;
      } else {
        console.log("Nu s-au găsit date pentru vehiculul:", registrationNumber);
        throw new Error("Nu s-au găsit informații pentru acest vehicul");
      }
    } else {
      // Fallback pentru vechiul format sau alte formate
      console.log("Folosim vechiul format de răspuns sau format nerecunoscut");
      return responseData;
    }
  } catch (error) {
    console.error("Eroare la obținerea informațiilor vehiculului:", error);
    throw error;
  }
};

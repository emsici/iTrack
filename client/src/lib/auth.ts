import { Capacitor } from "@capacitor/core";
import { CapacitorHttp } from '@capacitor/core';
import type { Login } from "@shared/schema";
import { getApiUrl } from './config';

/**
 * Decodează un token JWT și returnează payload-ul
 * @param token Token JWT
 * @returns Payload decodat sau null dacă tokenul este invalid
 */
export const decodeToken = (token: string): any | null => {
  try {
    if (!token) return null;
    
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return null;
    
    const payload = tokenParts[1];
    const decodedPayload = atob(payload);
    return JSON.parse(decodedPayload);
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
    
    // Configurez URL-ul folosind configurația centralizată
    const apiUrl = getApiUrl('/api/login');
    console.log("URL autentificare:", apiUrl, "Platformă nativă:", Capacitor.isNativePlatform());
    
    // Construim payload-ul de autentificare
    const payload = {
      email: credentials.email,
      password: credentials.password
    };
    
    console.log("Payload autentificare:", JSON.stringify(payload));
    
    let response;
    
    if (isNative) {
      // Pe platformele native folosim CapacitorHttp
      const httpResponse = await CapacitorHttp.request({
        url: apiUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: payload
      });
      
      response = {
        ok: httpResponse.status >= 200 && httpResponse.status < 300,
        status: httpResponse.status,
        json: async () => httpResponse.data
      };
    } else {
      // Pe browser folosim fetch
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      };
      
      response = await fetch(apiUrl, requestOptions);
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log("Răspuns autentificare:", responseData);
    
    // Verificăm rezultatul
    console.log("Rezultat autentificare:", responseData, apiUrl);
    
    if (responseData.status === "success" && responseData.token) {
      console.log("Rezultat autentificare API intern:", true);
      return {
        success: true,
        token: responseData.token,
        user: {
          email: credentials.email
        }
      };
    } else {
      console.log("Rezultat autentificare API intern:", false);
      return {
        success: false,
        message: responseData.message || "Credențiale invalide"
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

    // Configurez URL-ul în funcție de platformă
    const isNative = isNativePlatform();
    const baseUrl = isNative ? 'https://' + window.location.hostname : '';
    const apiUrl = `${baseUrl}/api/vehicle?nr=${registrationNumber}`;
    console.log("URL vehicul:", apiUrl, "Platformă nativă:", isNative);

    let response;
    
    if (isNative) {
      // Pe platformele native folosim CapacitorHttp
      const httpResponse = await CapacitorHttp.request({
        url: apiUrl,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      response = {
        ok: httpResponse.status >= 200 && httpResponse.status < 300,
        status: httpResponse.status,
        json: async () => httpResponse.data,
        clone: () => ({
          json: async () => httpResponse.data
        })
      };
    } else {
      // Pe browser folosim fetch
      response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
    }

    console.log("Răspuns informații vehicul (browser):", await response.clone().json());

    const data = await response.json();
    console.log("=== RĂSPUNS RAW API VEHICUL ===");
    console.log("Status:", data.status);
    console.log("Count:", data.count);
    console.log("Data array:", data.data);
    console.log("Întreg răspunsul:", JSON.stringify(data, null, 2));

    if (data.status === "success" && data.count > 0 && data.data.length > 0) {
      const vehicleData = data.data[0];
      
      return {
        nr: registrationNumber,
        uit: vehicleData.UIT || vehicleData.uit,
        start_locatie: vehicleData.denumireLocStart || vehicleData.start_locatie,
        stop_locatie: vehicleData.denumireLocStop || vehicleData.stop_locatie,
        codDeclarant: vehicleData.codDeclarant,
        denumireCui: vehicleData.denumireCui,
        dataTransport: vehicleData.dataTransport,
        ikRoTrans: vehicleData.ikRoTrans,
        allTransports: data.data.map((transport: any) => ({
          ...transport,
          uit: transport.UIT || transport.uit,
          start_locatie: transport.denumireLocStart || transport.start_locatie,
          stop_locatie: transport.denumireLocStop || transport.stop_locatie
        }))
      };
    } else {
      console.log("Nu s-au găsit date pentru vehiculul:", registrationNumber);
      throw new Error("Vehiculul nu a fost găsit sau nu are transporturi active");
    }
  } catch (error) {
    console.error("Eroare la obținerea informațiilor vehiculului:", error);
    throw error;
  }
};
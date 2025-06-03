// Test direct pentru transmisia GPS
import { sendGpsUpdate } from './gpsService';

export const testGpsTransmission = async () => {
  console.log("=== ÎNCEPE TESTUL TRANSMISIEI GPS ===");
  
  // Date de test cu coordonate reale din Constanța
  const testCoords = {
    lat: 44.25840743717571,
    lng: 28.618465276625948,
    timestamp: "2025-06-02T16:54:58.514Z",
    viteza: 0,
    directie: 0,
    altitudine: 0,
    baterie: 100
  };
  
  const vehicleNr = "B200ABC";
  const uit = "5W3Q9L6L2R4J7N26";
  const status = 2; // 2 = active
  const token = localStorage.getItem('token') || "";
  
  console.log("[TEST GPS] Date pentru transmisie:", {
    coords: testCoords,
    vehicleNr,
    uit,
    status,
    hasToken: !!token
  });
  
  if (!token) {
    console.error("[TEST GPS] ❌ Nu există token de autentificare");
    return false;
  }
  
  try {
    console.log("[TEST GPS] Trimit datele GPS către server...");
    
    const success = await sendGpsUpdate(
      testCoords,
      vehicleNr,
      uit,
      status,
      token
    );
    
    if (success) {
      console.log("[TEST GPS] ✅ SUCCES! Datele au fost trimise");
      console.log("[TEST GPS] Verifică acum https://www.euscagency.com/etsm3/platforme/transport/apk/rezultate.php");
    } else {
      console.log("[TEST GPS] ❌ Transmisia a eșuat");
    }
    
    return success;
    
  } catch (error) {
    console.error("[TEST GPS] ❌ Excepție la transmisie:", error);
    return false;
  }
};

// Funcție pentru testare din consolă
(window as any).testGPS = testGpsTransmission;
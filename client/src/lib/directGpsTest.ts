// Test direct pentru transmisia GPS către gps.php
export const testDirectGpsTransmission = async () => {
  console.log("=== TEST DIRECT GPS TRANSMISSION ===");
  
  const testData = {
    lat: 44.25839110669698,
    lng: 28.618466970065064,
    timestamp: "2025-06-02 16:59:27",
    viteza: 0,
    directie: 0,
    altitudine: 0,
    baterie: 100,
    numar_inmatriculare: "B200ABC",
    uit: "5W3Q9L6L2R4J7N26",
    status: 2,
    hdop: 2.5,
    gsm_signal: 85
  };
  
  console.log("[DIRECT GPS] Trimitem datele:", testData);
  
  try {
    const response = await fetch("https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    
    console.log("[DIRECT GPS] Răspuns server status:", response.status);
    console.log("[DIRECT GPS] Răspuns server text:", responseText);
    
    if (response.ok) {
      console.log("[DIRECT GPS] ✅ SUCCES! Verifică rezultate.php");
      return true;
    } else {
      console.log("[DIRECT GPS] ❌ Eroare response:", response.status);
      return false;
    }
    
  } catch (error) {
    console.error("[DIRECT GPS] ❌ Eroare fetch:", error);
    return false;
  }
};

// Make function available globally for console access
(window as any).testDirectGPS = testDirectGpsTransmission;
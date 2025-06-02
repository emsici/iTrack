// Serviciu independent pentru intervalul GPS de 60 secunde
let gpsInterval: number | null = null;

export const startGpsInterval = (
  sendGpsUpdate: Function,
  getGpsCoordinates: () => any,
  getVehicleInfo: () => any,
  getCurrentUit: () => any,
  getToken: () => string,
  getTransportStatus: () => string
) => {
  console.log("[GPS Interval Service] Pornire interval 60 secunde");
  
  // Oprește intervalul existent dacă există
  if (gpsInterval) {
    clearInterval(gpsInterval);
  }
  
  gpsInterval = window.setInterval(() => {
    console.log("[GPS Interval Service] Verificare la 60 secunde...");
    
    const status = getTransportStatus();
    const coords = getGpsCoordinates();
    const vehicle = getVehicleInfo();
    const uit = getCurrentUit();
    const token = getToken();
    
    console.log("[GPS Interval Service] Stare:", {
      status,
      hasCoords: !!coords,
      hasVehicle: !!vehicle?.nr,
      hasUit: !!uit?.uit,
      hasToken: !!token
    });
    
    if (status === 'active' && coords && vehicle?.nr && uit?.uit && token) {
      console.log("[GPS Interval Service] Transmisie GPS...", coords);
      
      sendGpsUpdate(coords, vehicle.nr, uit.uit, 2, token)
        .then((success: boolean) => {
          if (success) {
            console.log("[GPS Interval Service] ✅ Transmisie reușită - verifică rezultate.php");
          } else {
            console.log("[GPS Interval Service] ❌ Transmisie eșuată");
          }
        })
        .catch((e: any) => {
          console.error("[GPS Interval Service] Eroare transmisie:", e);
        });
    } else {
      console.log("[GPS Interval Service] Nu sunt îndeplinite condițiile pentru transmisie");
    }
  }, 60000); // 60 secunde
  
  console.log("[GPS Interval Service] Interval pornit cu ID:", gpsInterval);
};

export const stopGpsInterval = () => {
  if (gpsInterval) {
    console.log("[GPS Interval Service] Oprire interval GPS");
    clearInterval(gpsInterval);
    gpsInterval = null;
  }
};

export const isGpsIntervalActive = () => {
  return gpsInterval !== null;
};

// Test direct pentru transmisie
export const testGpsTransmissionNow = async () => {
  console.log("[GPS Test Direct] Începe testul...");
  
  const testData = {
    lat: 44.258391126280266,
    lng: 28.618467824699607,
    timestamp: "2025-06-02 17:00:24",
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
  
  try {
    const response = await fetch("https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    console.log("[GPS Test Direct] Status:", response.status);
    console.log("[GPS Test Direct] Răspuns:", responseText);
    
    if (response.ok) {
      console.log("[GPS Test Direct] ✅ SUCCES! Verifică rezultate.php");
      return true;
    } else {
      console.log("[GPS Test Direct] ❌ Eroare status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("[GPS Test Direct] ❌ Eroare:", error);
    return false;
  }
};

// Funcții globale pentru consolă
(window as any).testGpsNow = testGpsTransmissionNow;
(window as any).startGpsInterval = startGpsInterval;
(window as any).stopGpsInterval = stopGpsInterval;
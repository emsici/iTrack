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
  console.log("[GPS Optimizat] Pornire interval 60 secunde cu citire GPS la transmisie");
  
  // Oprește intervalul existent dacă există
  if (gpsInterval) {
    clearInterval(gpsInterval);
  }
  
  gpsInterval = window.setInterval(async () => {
    console.log("[GPS Optimizat] Verificare la 60 secunde - încep citirea GPS...");
    
    const status = getTransportStatus();
    const vehicle = getVehicleInfo();
    const uit = getCurrentUit();
    const token = getToken();
    
    console.log("[GPS Optimizat] Stare disponibilă:", {
      status,
      hasVehicle: !!vehicle?.nr,
      hasUit: !!uit?.uit,
      hasToken: !!token
    });
    
    if (status === 'active' && vehicle?.nr && uit?.uit && token) {
      try {
        console.log("[GPS Optimizat] Citesc coordonate GPS pentru transmisie...");
        
        // Citim GPS-ul DOAR ACUM, la momentul transmisiei
        const coords = await new Promise<any>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation nu este suportat"));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const gpsCoords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                timestamp: new Date().toISOString(),
                viteza: position.coords.speed || 0,
                directie: position.coords.heading || 0,
                altitudine: position.coords.altitude || 0,
                baterie: 100
              };
              console.log("[GPS Optimizat] Coordonate citite cu succes:", gpsCoords);
              resolve(gpsCoords);
            },
            (error) => {
              console.warn("[GPS Optimizat] Eroare la citirea coordonatelor:", error);
              reject(error);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
          );
        });

        console.log("[GPS Optimizat] Transmit coordonatele citite la server...");
        
        const success = await sendGpsUpdate(coords, vehicle.nr, uit.uit, 2, token);
        
        if (success) {
          console.log("[GPS Optimizat] ✅ Transmisie automată reușită la", new Date().toLocaleTimeString());
        } else {
          console.log("[GPS Optimizat] ❌ Transmisie automată eșuată");
        }
      } catch (error) {
        console.error("[GPS Optimizat] Eroare la citirea/transmisia GPS:", error);
      }
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
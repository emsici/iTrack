// Serviciu simplu pentru transmisia GPS automată
let gpsTransmissionInterval: number | null = null;

export const startSimpleGpsTransmission = () => {
  console.log("[Simple GPS] Pornire transmisie automată GPS la 60 secunde");
  
  if (gpsTransmissionInterval) {
    clearInterval(gpsTransmissionInterval);
  }
  
  const transmitGps = async () => {
    try {
      // Obținem poziția curentă
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        });
      });
      
      const gpsData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        viteza: Math.round(position.coords.speed || 0),
        directie: Math.round(position.coords.heading || 0),
        altitudine: Math.round(position.coords.altitude || 0),
        baterie: 100,
        numar_inmatriculare: "B200ABC",
        uit: "5W3Q9L6L2R4J7N26",
        status: 2,
        hdop: position.coords.accuracy || 2.5,
        gsm_signal: 85
      };
      
      console.log("[Simple GPS] Transmitem coordonate:", gpsData);
      
      const response = await fetch("/api/gps/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(gpsData)
      });
      
      if (response.ok) {
        console.log("[Simple GPS] ✅ Transmisie reușită - verifică rezultate.php");
      } else {
        console.log("[Simple GPS] ❌ Eroare transmisie:", response.status);
      }
      
    } catch (error) {
      console.error("[Simple GPS] Eroare obținere/transmisie GPS:", error);
    }
  };
  
  // Transmitem imediat prima dată
  transmitGps();
  
  // Apoi la fiecare 60 secunde
  gpsTransmissionInterval = window.setInterval(transmitGps, 60000);
  
  console.log("[Simple GPS] Interval setat pentru transmisie la 60s");
};

export const stopSimpleGpsTransmission = () => {
  if (gpsTransmissionInterval) {
    clearInterval(gpsTransmissionInterval);
    gpsTransmissionInterval = null;
    console.log("[Simple GPS] Interval oprit");
  }
};

// Funcții globale pentru consolă
(window as any).startGpsTransmission = startSimpleGpsTransmission;
(window as any).stopGpsTransmission = stopSimpleGpsTransmission;
/**
 * Serviciu pentru transmisia GPS automată la fiecare 60 de secunde
 */

export interface GpsTransmissionData {
  lat: number;
  lng: number;
  timestamp: string;
  viteza: number;
  directie: number;
  altitudine: number;
  baterie: number;
  numar_inmatriculare: string;
  uit: string;
  status: number; // 2=active, 3=paused, 4=finished
  hdop: number;
  gsm_signal: number;
}

class AutoGpsTransmissionService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  
  async transmitGpsData(data: GpsTransmissionData): Promise<boolean> {
    try {
      console.log("[AutoGPS] Transmitem date GPS:", data);
      
      const response = await fetch("/api/gps/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("[AutoGPS] ✅ Transmisie reușită:", result);
        return true;
      } else {
        console.error("[AutoGPS] ❌ Eroare transmisie:", response.status);
        return false;
      }
    } catch (error) {
      console.error("[AutoGPS] ❌ Excepție transmisie:", error);
      return false;
    }
  }
  
  start(getGpsDataCallback: () => Promise<GpsTransmissionData | null>) {
    if (this.isRunning) {
      console.log("[AutoGPS] Serviciul rulează deja");
      return;
    }
    
    console.log("[AutoGPS] 🚀 Pornesc transmisia GPS automată (la fiecare 60s)");
    this.isRunning = true;
    
    // Prima transmisie imediată
    this.performTransmission(getGpsDataCallback);
    
    // Programez transmisiile la fiecare 60 de secunde
    this.intervalId = setInterval(() => {
      this.performTransmission(getGpsDataCallback);
    }, 60000); // 60 secunde
  }
  
  private async performTransmission(getGpsDataCallback: () => Promise<GpsTransmissionData | null>) {
    try {
      console.log("[AutoGPS] 📡 Executez transmisie programată...");
      const gpsData = await getGpsDataCallback();
      
      if (gpsData) {
        const success = await this.transmitGpsData(gpsData);
        if (success) {
          console.log("[AutoGPS] ✅ Transmisie automată reușită");
        } else {
          console.log("[AutoGPS] ❌ Transmisie automată eșuată");
        }
      } else {
        console.log("[AutoGPS] ⚠️ Nu există date GPS disponibile pentru transmisie");
      }
    } catch (error) {
      console.error("[AutoGPS] ❌ Eroare în transmisia automată:", error);
    }
  }
  
  stop() {
    if (!this.isRunning) {
      console.log("[AutoGPS] Serviciul nu rulează");
      return;
    }
    
    console.log("[AutoGPS] 🛑 Opresc transmisia GPS automată");
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
  }
  
  isActive(): boolean {
    return this.isRunning;
  }
}

// Instanță singleton
export const autoGpsService = new AutoGpsTransmissionService();

// Funcție globală pentru testare
(window as any).startAutoGpsTransmission = () => {
  const testCallback = async (): Promise<GpsTransmissionData | null> => {
    return {
      lat: 44.25839211286612,
      lng: 28.61846700113337,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
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
  };
  
  autoGpsService.start(testCallback);
  console.log("✅ Transmisia GPS automată a fost pornită!");
};

(window as any).stopAutoGpsTransmission = () => {
  autoGpsService.stop();
  console.log("🛑 Transmisia GPS automată a fost oprită!");
};
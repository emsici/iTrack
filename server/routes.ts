import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, gpsDataSchema } from "@shared/schema";
import fetch from "node-fetch";
import transportRoutes from "./routes/transportRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Montează rutele pentru transport
  app.use("/api/transport", transportRoutes);
  // Login endpoint - proxy to external API
  app.post("/api/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      console.log("Încercare de autentificare cu:", validatedData);
      
      // Forward request to the external API
      // Nu adăugăm Content-Type header, conform testelor din Postman
      const response = await fetch("https://www.euscagency.com/etsm3/platforme/transport/apk/login.php", {
        method: "POST",
        body: JSON.stringify(validatedData)
      });
      
      const data = await response.json();
      console.log("Răspuns de la API extern:", data);
      
      return res.status(response.status).json(data);
    } catch (error) {
      console.error("Eroare la autentificare:", error);
      return res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Vehicle info endpoint - proxy to external API
  app.get("/api/vehicle", async (req, res) => {
    try {
      // Extragem numărul de înmatriculare din query params
      const registrationNumber = req.query.nr;
      
      if (!registrationNumber) {
        return res.status(400).json({ message: "Missing registration number" });
      }
      
      console.log("Cerere informații vehicul:", registrationNumber);
      console.log("Token autorizare:", req.headers.authorization);
      
      // Forward request to the external API
      const response = await fetch(`https://www.euscagency.com/etsm3/platforme/transport/apk/vehicul.php?nr=${registrationNumber}`, {
        method: "GET",
        headers: {
          "Authorization": req.headers.authorization || ""
        }
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get vehicle information" });
    }
  });

  // Variabilă pentru stocarea token-ului Bearer
  let bearerToken: string | null = null;
  let tokenExpiry: number = 0;
  let currentGpsCredentials: { email: string; password: string } | null = null;

  // Funcție pentru autentificare și obținerea token-ului Bearer
  async function getAuthToken(): Promise<string | null> {
    if (!currentGpsCredentials) {
      console.log("[Auth] Credențiale GPS nu sunt disponibile");
      return null;
    }
    
    console.log("[Auth] Începe procesul de autentificare...");
    
    // Verifică dacă token-ul există și nu a expirat
    if (bearerToken && Date.now() < tokenExpiry) {
      console.log("[Auth] Token valid existent, îl folosesc pe cel actual");
      return bearerToken;
    }

    try {
      console.log("[Auth] Fac cerere de autentificare către server...");
      
      const authResponse = await fetch("https://www.euscagency.com/etsm3/platforme/transport/apk/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          email: currentGpsCredentials!.email,
          password: currentGpsCredentials!.password
        })
      });

      console.log("[Auth] Status răspuns autentificare:", authResponse.status);

      if (authResponse.ok) {
        const authData: any = await authResponse.json();
        console.log("[Auth] Date autentificare primite:", authData);
        
        if (authData.status === "success" && authData.token) {
          bearerToken = authData.token;
          // Token-ul expiră în 1 oră (3600 secunde)
          tokenExpiry = Date.now() + (3600 * 1000);
          console.log("[Auth] ✅ Token Bearer obținut cu succes:", authData.token.substring(0, 50) + "...");
          return bearerToken;
        } else {
          console.log("[Auth] ❌ Răspuns invalid - status:", authData.status, "token:", !!authData.token);
        }
      } else {
        const errorText = await authResponse.text();
        console.error("[Auth] ❌ Eroare HTTP autentificare:", authResponse.status, errorText);
      }
    } catch (error) {
      console.error("[Auth] ❌ Excepție în procesul de autentificare:", error);
    }

    console.log("[Auth] Procesul de autentificare a eșuat");
    return null;
  }

  // GPS proxy endpoint - transmite datele către serverul extern
  app.post("/api/gps/send", async (req, res) => {
    try {
      console.log("[GPS Proxy] Primesc date GPS pentru transmisie:", req.body);
      console.log("[GPS Proxy] Verificare token existent:", bearerToken ? "există" : "nu există");
      
      // Obține token-ul Bearer
      const token = await getAuthToken();
      console.log("[GPS Proxy] Token obținut:", token ? "succes" : "eșec");
      
      if (!token) {
        console.log("[GPS Proxy] Nu s-a putut obține token-ul de autentificare");
        return res.status(401).json({
          success: false,
          message: "Failed to authenticate with GPS server"
        });
      }

      console.log("[GPS Proxy] Trimit date GPS cu Bearer token...");
      
      const response = await fetch("https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "User-Agent": "iTrack-Mobile-App/1.0"
        },
        body: JSON.stringify(req.body)
      });
      
      const responseText = await response.text();
      console.log("[GPS Proxy] Răspuns server extern:", response.status, responseText);
      
      if (response.ok) {
        res.json({ 
          success: true, 
          message: "GPS data sent successfully",
          serverResponse: responseText 
        });
      } else {
        // Dacă primim 401, încearcă să reîmprospătezi token-ul
        if (response.status === 401) {
          console.log("[GPS Proxy] Token expirat, reîncerc autentificarea...");
          bearerToken = null;
          tokenExpiry = 0;
        }
        
        res.status(500).json({ 
          success: false, 
          message: "Failed to send GPS data",
          serverResponse: responseText,
          statusCode: response.status
        });
      }
      
    } catch (error) {
      console.error("[GPS Proxy] Eroare transmisie GPS:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error sending GPS data",
        error: (error as Error).message 
      });
    }
  });

  // Set GPS credentials endpoint
  app.post("/api/gps/credentials", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email și parola sunt obligatorii" });
      }
      
      currentGpsCredentials = { email, password };
      console.log("[GPS Credentials] Credențiale GPS setate cu succes");
      
      res.json({ success: true, message: "Credențiale GPS setate cu succes" });
    } catch (error) {
      console.error("[GPS Credentials] Error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Vehicle registration endpoint
  app.post("/api/vehicle", async (req, res) => {
    try {
      const { registrationNumber, authToken } = req.body;
      
      if (!registrationNumber || !authToken) {
        return res.status(400).json({ 
          success: false, 
          message: "Registration number and auth token required" 
        });
      }
      
      console.log("[Vehicle] Cerere înregistrare vehicul:", registrationNumber);
      
      // Forward to external vehicle API
      const response = await fetch(`https://www.euscagency.com/etsm3/platforme/transport/apk/vehicul.php?nr=${registrationNumber}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      
      const data = await response.json();
      console.log("[Vehicle] Răspuns API extern:", data);
      
      if (data.status === 'success' && data.count > 0 && data.data.length > 0) {
        const vehicleData = data.data[0];
        const vehicleInfo = {
          nr: registrationNumber,
          uit: vehicleData.UIT || vehicleData.uit,
          start_locatie: vehicleData.denumireLocStart || vehicleData.start_locatie,
          stop_locatie: vehicleData.denumireLocStop || vehicleData.stop_locatie,
          codDeclarant: vehicleData.codDeclarant,
          denumireCui: vehicleData.denumireCui,
          dataTransport: vehicleData.dataTransport,
          ikRoTrans: vehicleData.ikRoTrans,
          allTransports: data.data.map((transport: any) => ({
            uit: transport.UIT || transport.uit,
            start_locatie: transport.denumireLocStart || transport.start_locatie,
            stop_locatie: transport.denumireLocStop || transport.stop_locatie,
            dataTransport: transport.dataTransport,
            ikRoTrans: transport.ikRoTrans
          }))
        };
        
        res.json({
          success: true,
          vehicleInfo: vehicleInfo
        });
      } else {
        res.json({
          success: false,
          message: "Vehiculul nu a fost găsit sau nu are transporturi active"
        });
      }
      
    } catch (error) {
      console.error("[Vehicle] Error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Server error" 
      });
    }
  });

  // Get transport status endpoint
  app.get("/api/transport/status", async (req, res) => {
    try {
      const vehicleNumber = req.query.vehicle as string;
      if (!vehicleNumber) {
        return res.status(400).json({ error: "Vehicle number required" });
      }
      
      // Pentru moment returnăm status inactiv - în viitor se va interoga baza de date
      res.json({
        status: "inactive",
        activeUit: null,
        isGpsActive: false,
        lastGpsUpdate: null
      });
    } catch (error) {
      console.error("[Transport Status] Error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // GPS transmission proxy endpoint
  app.post("/api/gps/transmit", async (req, res) => {
    try {
      const gpsData = req.body;
      const authHeader = req.headers.authorization;
      
      console.log("[GPS Proxy] Transmit GPS data:", gpsData);
      
      // Forward to external GPS API
      const response = await fetch("https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader || ""
        },
        body: JSON.stringify(gpsData)
      });
      
      if (response.ok) {
        const result = await response.text();
        console.log("[GPS Proxy] ✅ Transmisie reușită. Răspuns server:", result);
        res.json({ success: true, message: "GPS data transmitted successfully", serverResponse: result });
      } else {
        const errorText = await response.text();
        console.error("[GPS Proxy] ❌ Eroare transmisie:", response.status, errorText);
        res.status(response.status).json({ success: false, error: "Failed to transmit GPS data", details: errorText });
      }
      
    } catch (error) {
      console.error("[GPS Proxy] Eroare la transmisia GPS:", error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  });

  // Redirecționează vechiul endpoint GPS către noul endpoint din transportRoutes
  app.post("/api/gps", async (req, res) => {
    res.redirect(307, "/api/transport/gps"); // 307 păstrează metoda HTTP și body-ul
  });

  const httpServer = createServer(app);

  return httpServer;
}

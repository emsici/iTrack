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

  // Funcție pentru autentificare și obținerea token-ului Bearer
  async function getAuthToken(): Promise<string | null> {
    // Verifică dacă token-ul există și nu a expirat
    if (bearerToken && Date.now() < tokenExpiry) {
      return bearerToken;
    }

    try {
      console.log("[Auth] Obțin token Bearer...");
      
      const authResponse = await fetch("https://www.euscagency.com/etsm3/platforme/transport/apk/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          email: "test@exemplu.com",
          password: "parola123"
        })
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        console.log("[Auth] Răspuns autentificare:", authData);
        
        if (authData.token) {
          bearerToken = authData.token;
          // Token-ul expiră în 1 oră (3600 secunde)
          tokenExpiry = Date.now() + (3600 * 1000);
          console.log("[Auth] ✅ Token Bearer obținut cu succes");
          return bearerToken;
        }
      } else {
        console.error("[Auth] ❌ Eroare autentificare:", authResponse.status);
      }
    } catch (error) {
      console.error("[Auth] ❌ Excepție autentificare:", error);
    }

    return null;
  }

  // GPS proxy endpoint - transmite datele către serverul extern
  app.post("/api/gps/send", async (req, res) => {
    try {
      console.log("[GPS Proxy] Primesc date GPS pentru transmisie:", req.body);
      
      // Obține token-ul Bearer
      const token = await getAuthToken();
      
      if (!token) {
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

  // Redirecționează vechiul endpoint GPS către noul endpoint din transportRoutes
  app.post("/api/gps", async (req, res) => {
    res.redirect(307, "/api/transport/gps"); // 307 păstrează metoda HTTP și body-ul
  });

  const httpServer = createServer(app);

  return httpServer;
}

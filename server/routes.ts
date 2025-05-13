import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, gpsDataSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Login endpoint - proxy to external API
  app.post("/api/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Forward request to the external API
      const response = await fetch("https://www.euscagency.com/etsm3/platforme/transport/apk/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(validatedData)
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      return res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Vehicle info endpoint - proxy to external API
  app.get("/api/vehicle/:nr", async (req, res) => {
    try {
      const registrationNumber = req.params.nr;
      
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

  // GPS data endpoint - proxy to external API
  app.post("/api/gps", async (req, res) => {
    try {
      const validatedData = gpsDataSchema.parse(req.body);
      
      // Store GPS data in local storage for tracking purposes
      await storage.saveGpsData({
        vehicleId: 1, // Placeholder since we don't have a real vehicle ID
        uit: validatedData.uit,
        registrationNumber: validatedData.numar_inmatriculare,
        lat: validatedData.lat,
        lng: validatedData.lng,
        timestamp: new Date(validatedData.timestamp),
        speed: validatedData.viteza,
        direction: validatedData.directie,
        altitude: validatedData.altitudine,
        battery: validatedData.baterie
      });
      
      // Forward request to the external API
      const response = await fetch("https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": req.headers.authorization || ""
        },
        body: JSON.stringify(validatedData)
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      return res.status(400).json({ message: "Invalid GPS data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

import { Router } from "express";
import fetch from "node-fetch";
import { gpsDataSchema } from "@shared/schema";
import { storage } from "../storage";

const router = Router();

// Endpoint pentru obținerea transporturilor disponibile pentru un vehicul
router.get("/transports/:vehicleId", async (req, res) => {
  try {
    const vehicleId = req.params.vehicleId;
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // În implementarea finală, ar trebui să interrogăm API-ul extern pentru transporturile disponibile
    // În acest exemplu, returnăm doar UIT-ul din înregistrarea vehiculului
    const response = await fetch(`https://www.euscagency.com/etsm3/platforme/transport/apk/vehicul.php?nr=${vehicleId}`, {
      method: "GET",
      headers: {
        "Authorization": token
      }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ message: "Failed to fetch transports" });
    }
    
    const vehicleData = await response.json();
    
    // Transformăm datele primite de la API extern într-un format potrivit pentru aplicația noastră
    const transports = [{
      id: "1", // ID unic generat
      uit: vehicleData.uit,
      start_locatie: vehicleData.start_locatie,
      stop_locatie: vehicleData.stop_locatie,
      status: "inactive"
    }];
    
    return res.json(transports);
  } catch (error) {
    console.error("Error fetching transports:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Endpoint pentru transmiterea datelor GPS
router.post("/gps", async (req, res) => {
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
    console.error("Error handling GPS data:", error);
    return res.status(400).json({ message: "Invalid GPS data" });
  }
});

// Endpoint pentru actualizarea stării transportului
router.put("/transport/:transportId/status", async (req, res) => {
  try {
    const transportId = req.params.transportId;
    const { status } = req.body;
    
    if (!["active", "paused", "finished"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    // În implementarea finală, am actualiza statusul în baza de date sau am transmite către API-ul extern
    // Pentru acest exemplu, doar simulăm succesul
    
    // Obținem vehiculul asociat transportului pentru a-l include în răspuns
    const transport = {
      id: transportId,
      status,
      updated_at: new Date().toISOString()
    };
    
    return res.json(transport);
  } catch (error) {
    console.error("Error updating transport status:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
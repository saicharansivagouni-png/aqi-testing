import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3100;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Crop viability prediction endpoint
  app.post("/api/predict-crops", async (req, res) => {
    try {
      const { pm25, pm10, no2, co, so2, aqi } = req.body;
      
      if (pm25 === undefined || pm10 === undefined || no2 === undefined || co === undefined || so2 === undefined || aqi === undefined) {
        return res.status(400).json({ error: "Missing air quality parameters" });
      }

      // Dynamic import to support ESM
      const { predictCropViability } = await import("../frontend/src/services/crop.ts");
      const result = await predictCropViability(pm25, pm10, no2, co, so2, aqi);
      
      res.json(result);
    } catch (error) {
      console.error("Crop prediction error:", error);
      res.status(500).json({ error: "Failed to predict crops" });
    }
  });

  // Get crop thresholds endpoint
  app.get("/api/crop-thresholds", (req, res) => {
    const cropThresholds = {
      'Rice': { pm25_max: 75, pm10_max: 150, no2_max: 60, co_max: 3.0, so2_max: 60, aqi_max: 200 },
      'Wheat': { pm25_max: 85, pm10_max: 180, no2_max: 70, co_max: 3.5, so2_max: 70, aqi_max: 220 },
      'Corn': { pm25_max: 80, pm10_max: 160, no2_max: 65, co_max: 3.2, so2_max: 65, aqi_max: 210 },
      'Tomato': { pm25_max: 50, pm10_max: 100, no2_max: 40, co_max: 2.0, so2_max: 40, aqi_max: 150 },
      'Lettuce': { pm25_max: 35, pm10_max: 70, no2_max: 30, co_max: 1.5, so2_max: 30, aqi_max: 100 },
      'Apple': { pm25_max: 60, pm10_max: 130, no2_max: 50, co_max: 2.5, so2_max: 50, aqi_max: 180 },
      'Banana': { pm25_max: 70, pm10_max: 150, no2_max: 55, co_max: 3.0, so2_max: 55, aqi_max: 200 },
      'Mango': { pm25_max: 65, pm10_max: 140, no2_max: 52, co_max: 2.8, so2_max: 52, aqi_max: 190 },
      'Cotton': { pm25_max: 90, pm10_max: 200, no2_max: 75, co_max: 4.0, so2_max: 75, aqi_max: 250 },
      'Sugarcane': { pm25_max: 95, pm10_max: 210, no2_max: 80, co_max: 4.2, so2_max: 80, aqi_max: 270 }
    };
    res.json(cropThresholds);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(process.cwd(), "frontend"),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "frontend", "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

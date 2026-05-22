import { GoogleGenAI, Type } from "@google/genai";

export interface CropViability {
  crop: string;
  suitable: boolean;
  suitabilityScore: number; // 0-100
  reason: string;
}

export interface CropPredictResult {
  viableCrops: CropViability[];
  bestCrops: string[];
  agriculturalRecommendation: string;
  seasonalAdvice: string;
  riskFactors: string[];
  productivityLevel: "High" | "Moderate" | "Low";
}

export async function predictCropViability(pm25: number, pm10: number, no2: number, co: number, so2: number, aqi: number): Promise<CropPredictResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const prompt = `
    Act as an agricultural expert and air quality analyst. Based on the following air quality parameters, 
    analyze crop viability and provide agricultural recommendations.
    
    Air Quality Parameters:
    - PM2.5: ${pm25} µg/m³
    - PM10: ${pm10} µg/m³
    - NO2: ${no2} µg/m³
    - CO: ${co} mg/m³
    - SO2: ${so2} µg/m³
    - AQI: ${aqi}
    
    Evaluate the suitability of these crops:
    1. Rice - optimal AQI: <200, PM2.5: <75
    2. Wheat - optimal AQI: <220, PM2.5: <85
    3. Corn - optimal AQI: <210, PM2.5: <80
    4. Tomato - optimal AQI: <150, PM2.5: <50
    5. Lettuce - optimal AQI: <100, PM2.5: <35
    6. Apple - optimal AQI: <180, PM2.5: <60
    7. Banana - optimal AQI: <200, PM2.5: <70
    8. Mango - optimal AQI: <190, PM2.5: <65
    9. Cotton - optimal AQI: <250, PM2.5: <90
    10. Sugarcane - optimal AQI: <270, PM2.5: <95
    
    Return JSON with:
    {
      "viableCrops": [
        { 
          "crop": "string", 
          "suitable": boolean, 
          "suitabilityScore": number (0-100),
          "reason": "string explaining why suitable or not"
        }
      ],
      "bestCrops": ["array of top 3 most suitable crops"],
      "agriculturalRecommendation": "specific farming practices and measures",
      "seasonalAdvice": "when to plant and harvest based on air quality trends",
      "riskFactors": ["array of potential crop risks due to air quality"],
      "productivityLevel": "High" | "Moderate" | "Low"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert agricultural scientist specializing in air quality impacts on crop productivity. Provide practical, science-based recommendations for crop viability.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            viableCrops: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  crop: { type: Type.STRING },
                  suitable: { type: Type.BOOLEAN },
                  suitabilityScore: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                },
                required: ["crop", "suitable", "suitabilityScore", "reason"]
              }
            },
            bestCrops: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            agriculturalRecommendation: { type: Type.STRING },
            seasonalAdvice: { type: Type.STRING },
            riskFactors: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            productivityLevel: { type: Type.STRING }
          },
          required: ["viableCrops", "bestCrops", "agriculturalRecommendation", "seasonalAdvice", "riskFactors", "productivityLevel"]
        }
      }
    });

    const content = response.candidates?.[0]?.content?.parts?.[0];
    if (!content || !("text" in content)) {
      throw new Error("No valid response from model");
    }

    return JSON.parse(content.text);
  } catch (error) {
    console.error("Error predicting crop viability:", error);
    throw error;
  }
}

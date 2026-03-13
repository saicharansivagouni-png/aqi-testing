import { GoogleGenAI, Type } from "@google/genai";

export interface AQIInput {
  pm25: number;
  pm10: number;
  no2: number;
  co: number;
  so2: number;
}

export interface AQIResult {
  aqi: number;
  category: string;
  recommendation: string;
  pollutants: {
    name: string;
    value: number;
    impact: string;
  }[];
  futurePrediction: {
    aqi: number;
    category: string;
    trend: string;
    reason: string;
    hourlyForecast: {
      time: string;
      aqi: number;
    }[];
  };
  yearlyTrend: {
    month: string;
    aqi: number;
  }[];
}

export async function predictAQI(input: AQIInput): Promise<AQIResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  const prompt = `
    Act as a highly accurate Air Quality Index (AQI) prediction model (similar to a Random Forest Regressor).
    Based on the following pollution parameters, predict the AQI and categorize it.
    
    Parameters:
    - PM2.5: ${input.pm25} µg/m³
    - PM10: ${input.pm10} µg/m³
    - NO2: ${input.no2} µg/m³
    - CO: ${input.co} mg/m³
    - SO2: ${input.so2} µg/m³
    
    Provide the result in JSON format with the following structure:
    {
      "aqi": number,
      "category": "Good" | "Moderate" | "Unhealthy for Sensitive Groups" | "Unhealthy" | "Very Unhealthy" | "Hazardous",
      "recommendation": "string",
      "pollutants": [
        { "name": "PM2.5", "value": number, "impact": "string" },
        { "name": "PM10", "value": number, "impact": "string" },
        { "name": "NO2", "value": number, "impact": "string" },
        { "name": "CO", "value": number, "impact": "string" },
        { "name": "SO2", "value": number, "impact": "string" }
      ],
      "futurePrediction": {
        "aqi": number,
        "category": "string",
        "trend": "Improving" | "Stable" | "Worsening",
        "reason": "string",
        "hourlyForecast": [
          { "time": "00:00", "aqi": number },
          { "time": "04:00", "aqi": number },
          { "time": "08:00", "aqi": number },
          { "time": "12:00", "aqi": number },
          { "time": "16:00", "aqi": number },
          { "time": "20:00", "aqi": number }
        ]
      },
      "yearlyTrend": [
        { "month": "Jan", "aqi": number },
        { "month": "Feb", "aqi": number },
        { "month": "Mar", "aqi": number },
        { "month": "Apr", "aqi": number },
        { "month": "May", "aqi": number },
        { "month": "Jun", "aqi": number },
        { "month": "Jul", "aqi": number },
        { "month": "Aug", "aqi": number },
        { "month": "Sep", "aqi": number },
        { "month": "Oct", "aqi": number },
        { "month": "Nov", "aqi": number },
        { "month": "Dec", "aqi": number }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert environmental scientist. Provide highly accurate AQI predictions based on provided pollutant levels. Always return strictly valid JSON matching the requested schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aqi: { type: Type.NUMBER },
            category: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            pollutants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  impact: { type: Type.STRING }
                },
                required: ["name", "value", "impact"]
              }
            },
            futurePrediction: {
              type: Type.OBJECT,
              properties: {
                aqi: { type: Type.NUMBER },
                category: { type: Type.STRING },
                trend: { type: Type.STRING },
                reason: { type: Type.STRING },
                hourlyForecast: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING },
                      aqi: { type: Type.NUMBER }
                    },
                    required: ["time", "aqi"]
                  }
                }
              },
              required: ["aqi", "category", "trend", "reason", "hourlyForecast"]
            },
            yearlyTrend: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  month: { type: Type.STRING },
                  aqi: { type: Type.NUMBER }
                },
                required: ["month", "aqi"]
              }
            }
          },
          required: ["aqi", "category", "recommendation", "pollutants", "futurePrediction", "yearlyTrend"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as AQIResult;
  } catch (error) {
    console.error("Error predicting AQI:", error);
    throw new Error("Failed to predict AQI. Please check your inputs or try again later.");
  }
}

export async function searchAQIByLocation(location: string): Promise<AQIResult> {
  // Check localStorage first, then environment variables
  const rawToken = (typeof window !== 'undefined' ? localStorage.getItem("waqi_token") : null) || import.meta.env.VITE_WAQI_API_KEY;
  const waqiToken = rawToken?.trim();
  
  if (!waqiToken) {
    throw new Error("WAQI API Key is missing. Please add it in the Settings (gear icon at the top).");
  }

  try {
    // 1. Fetch real-time data from WAQI API
    const waqiResponse = await fetch(`https://api.waqi.info/feed/${encodeURIComponent(location)}/?token=${waqiToken}`);
    const waqiData = await waqiResponse.json();

    if (waqiData.status !== "ok") {
      const errorMsg = waqiData.data === "Invalid key" 
        ? "The WAQI API key you entered is invalid. Please ensure you are using a valid World Air Quality Index token (not a Gemini API key). You can get one at aqicn.org."
        : (waqiData.data || "Failed to fetch data from WAQI API");
      throw new Error(errorMsg);
    }

    const data = waqiData.data;
    const iaqi = data.iaqi || {};

    // 2. Use Gemini to format and predict based on the REAL data from WAQI
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    const prompt = `
      I have real-time air quality data for ${location} from a public API.
      Data:
      - AQI: ${data.aqi}
      - PM2.5: ${iaqi.pm25?.v || "N/A"}
      - PM10: ${iaqi.pm10?.v || "N/A"}
      - NO2: ${iaqi.no2?.v || "N/A"}
      - CO: ${iaqi.co?.v || "N/A"}
      - SO2: ${iaqi.so2?.v || "N/A"}
      - Dominant Pollutant: ${data.dominentpol}
      
      Based on this data, provide a comprehensive AQI report in JSON format.
      Include recommendations, pollutant impacts, future predictions (hourly), and a yearly trend estimate.
      
      Structure:
      {
        "aqi": number,
        "category": "Good" | "Moderate" | "Unhealthy for Sensitive Groups" | "Unhealthy" | "Very Unhealthy" | "Hazardous",
        "recommendation": "string",
        "pollutants": [
          { "name": "PM2.5", "value": number, "impact": "string" },
          { "name": "PM10", "value": number, "impact": "string" },
          { "name": "NO2", "value": number, "impact": "string" },
          { "name": "CO", "value": number, "impact": "string" },
          { "name": "SO2", "value": number, "impact": "string" }
        ],
        "futurePrediction": {
          "aqi": number,
          "category": "string",
          "trend": "Improving" | "Stable" | "Worsening",
          "reason": "string",
          "hourlyForecast": [
            { "time": "00:00", "aqi": number },
            { "time": "04:00", "aqi": number },
            { "time": "08:00", "aqi": number },
            { "time": "12:00", "aqi": number },
            { "time": "16:00", "aqi": number },
            { "time": "20:00", "aqi": number }
          ]
        },
        "yearlyTrend": [
          { "month": "Jan", "aqi": number },
          { "month": "Feb", "aqi": number },
          { "month": "Mar", "aqi": number },
          { "month": "Apr", "aqi": number },
          { "month": "May", "aqi": number },
          { "month": "Jun", "aqi": number },
          { "month": "Jul", "aqi": number },
          { "month": "Aug", "aqi": number },
          { "month": "Sep", "aqi": number },
          { "month": "Oct", "aqi": number },
          { "month": "Nov", "aqi": number },
          { "month": "Dec", "aqi": number }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are an environmental data analyst. Use the provided real-time data to generate a detailed report. Do not use external search tools. Always return strictly valid JSON matching the requested schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aqi: { type: Type.NUMBER },
            category: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            pollutants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  impact: { type: Type.STRING }
                },
                required: ["name", "value", "impact"]
              }
            },
            futurePrediction: {
              type: Type.OBJECT,
              properties: {
                aqi: { type: Type.NUMBER },
                category: { type: Type.STRING },
                trend: { type: Type.STRING },
                reason: { type: Type.STRING },
                hourlyForecast: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING },
                      aqi: { type: Type.NUMBER }
                    },
                    required: ["time", "aqi"]
                  }
                }
              },
              required: ["aqi", "category", "trend", "reason", "hourlyForecast"]
            },
            yearlyTrend: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  month: { type: Type.STRING },
                  aqi: { type: Type.NUMBER }
                },
                required: ["month", "aqi"]
              }
            }
          },
          required: ["aqi", "category", "recommendation", "pollutants", "futurePrediction", "yearlyTrend"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as AQIResult;
  } catch (error) {
    console.error("Error searching AQI by location:", error);
    throw new Error(`Failed to find AQI for ${location}. Please ensure the location name is correct or try again later.`);
  }
}

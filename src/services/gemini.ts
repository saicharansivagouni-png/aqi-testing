
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
}

export async function predictAQI(input: AQIInput): Promise<AQIResult> {
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
      ]
    }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert environmental scientist. Provide highly accurate AQI predictions based on provided pollutant levels. Always return strictly valid JSON matching the requested schema." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 500
    });
    const responseText = completion.choices[0].message.content || "{}";
    const result = JSON.parse(responseText);
    return result as AQIResult;
  } catch (error) {
    console.error("Error predicting AQI:", error);
    throw new Error("Failed to predict AQI. Please check your inputs or try again later.");
  }
}

export async function searchAQIByLocation(location: string): Promise<AQIResult> {
  const waqiToken = process.env.VITE_WAQI_API_KEY;
  
  try {
    // 1. Fetch real-time data from WAQI API
    const waqiResponse = await fetch(`https://api.waqi.info/feed/${encodeURIComponent(location)}/?token=${waqiToken}`);
    const waqiData = await waqiResponse.json();

    if (waqiData.status !== "ok") {
      throw new Error(waqiData.data || "Failed to fetch data from WAQI API");
    }

    const data = waqiData.data;
    const iaqi = data.iaqi || {};

    // 2. Use Gemini to format based on the REAL data from WAQI
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
      Include recommendations and pollutant impacts.
      
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
            }
          },
          required: ["aqi", "category", "recommendation", "pollutants"]
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

import { GoogleGenAI, Type } from "@google/genai";
import type { RouteInfoResponse, WeatherInfo } from '../types';

// Initialize the Google AI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export async function getWeatherInfo(lat?: number, lng?: number): Promise<WeatherInfo | null> {
  const model = "gemini-2.5-flash";
  const prompt = lat && lng
    ? `What is the current weather for latitude ${lat} and longitude ${lng}? Provide the condition, temperature in Fahrenheit, wind speed in mph, and an icon name from this list: 'sun', 'cloud', 'rain', 'wind'.`
    : "What is the current weather in Denver, CO? Provide the condition, temperature in Fahrenheit, wind speed in mph, and an icon name from this list: 'sun', 'cloud', 'rain', 'wind'.";

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            condition: { type: Type.STRING },
            temperature: { type: Type.NUMBER },
            windSpeed: { type: Type.NUMBER },
            icon: { type: Type.STRING },
          },
          required: ["condition", "temperature", "windSpeed", "icon"],
        },
      },
    });

    const text = response.text.trim();
    if (!text) return null;

    const weatherData = JSON.parse(text);
    // Basic validation to ensure we have a valid object.
    if (weatherData && typeof weatherData.temperature === 'number') {
        return weatherData as WeatherInfo;
    }
    return null;
  } catch (error) {
    console.error("Error fetching weather info:", error);
    return null;
  }
}

export async function getRouteInfo(
  origin: string,
  destination: string,
  bikeSpeed: number,
  motorWattage?: number,
  batteryVoltage?: number
): Promise<RouteInfoResponse | null> {
  const model = 'gemini-2.5-flash';
  
  let prompt = `Provide an e-bike route from "${origin}" to "${destination}" in Denver, CO. The rider's average speed is ${bikeSpeed} mph. `;

  if (motorWattage && batteryVoltage) {
    prompt += `The e-bike has a ${motorWattage}W motor and a ${batteryVoltage}V battery. Estimate battery usage percentage for the trip. `;
  }

  prompt += `The route should prioritize bike-friendly paths. For the origin and destination, provide their resolved name and precise lat/lng coordinates. Provide the total distance in miles, estimated duration in minutes, a Google Maps encoded polyline for the route, turn-by-turn directions, and a list of up to 5 potential public e-bike charging stations along or very near the route.`;

  const locationPointSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      location: {
        type: Type.OBJECT,
        properties: {
          lat: { type: Type.NUMBER },
          lng: { type: Type.NUMBER },
        },
        required: ['lat', 'lng'],
      },
    },
    required: ['name', 'location'],
  };

  const routeSchema = {
    type: Type.OBJECT,
    properties: {
      origin: locationPointSchema,
      destination: locationPointSchema,
      distance: { type: Type.NUMBER, description: 'Total distance in miles' },
      duration: { type: Type.NUMBER, description: 'Estimated duration in minutes' },
      polyline: { type: Type.STRING, description: 'Google Maps encoded polyline string' },
      directions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Turn-by-turn directions'
      },
      batteryUsage: { type: Type.NUMBER, description: 'Optional estimated battery usage percentage' },
      chargingStations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            address: { type: Type.STRING },
            location: {
              type: Type.OBJECT,
              properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
              },
              required: ['lat', 'lng'],
            },
          },
          required: ['name', 'address', 'location'],
        },
      },
    },
    required: ['origin', 'destination', 'distance', 'duration', 'polyline', 'directions', 'chargingStations'],
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: routeSchema,
      },
    });

    const text = response.text.trim();
    if (!text) return null;
    
    const routeData = JSON.parse(text);
     // Basic validation to ensure we have a valid object.
    if (routeData && routeData.polyline) {
      return routeData as RouteInfoResponse;
    }
    return null;
  } catch (error) {
    console.error("Error fetching route info:", error);
    return null;
  }
}
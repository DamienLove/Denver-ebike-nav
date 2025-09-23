export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationPoint {
  name: string;
  location: Coordinates;
}

export interface ChargingStation {
  name: string;
  location: Coordinates;
  address: string;
}

export interface RouteDetails {
  origin: LocationPoint;
  destination: LocationPoint;
  distance: number; // in miles
  duration: number; // in minutes
  polyline: string; // encoded polyline
  directions: string[];
  batteryUsage?: number; // percentage
  bikeSpeed: number; // mph
}

export interface WeatherInfo {
  condition: string;
  temperature: number; // in °F
  windSpeed: number; // in mph
  icon: 'sun' | 'cloud' | 'rain' | 'wind';
}

// The raw response from Gemini API for route info
export interface RouteInfoResponse {
  origin: LocationPoint;
  destination: LocationPoint;
  distance: number;
  duration: number;
  polyline: string;
  directions: string[];
  batteryUsage?: number;
  chargingStations: ChargingStation[];
}

export interface User {
  uid: string;
  username: string | null;
  email: string | null;
  picture: string | null;
}

export interface Friend {
  id: string; // This is the user's UID from Firestore
  username: string;
  location: Coordinates;
  isOnline: boolean;
}
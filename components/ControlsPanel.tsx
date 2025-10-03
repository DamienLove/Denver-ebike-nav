
import React, { useState } from 'react';
import type { DailyForecast } from '../types';
import { LocationIcon, SpeedIcon, SunIcon, CloudIcon, RainIcon, WindIcon, CrosshairIcon, PartlyCloudyIcon, SnowIcon } from './Icons';

interface ControlsPanelProps {
  onSearch: () => void;
  isLoading: boolean;
  forecast: DailyForecast[] | null;
  origin: string;
  setOrigin: (value: string) => void;
  destination: string;
  setDestination: (value: string) => void;
  bikeSpeed: number;
  setBikeSpeed: (value: number) => void;
  motorWattage: string;
  setMotorWattage: (value: string) => void;
  batteryVoltage: string;
  setBatteryVoltage: (value: string) => void;
}

const ForecastSkeleton: React.FC = () => (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 mt-6 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-2 p-2 rounded-lg bg-gray-700/50">
                    <div className="h-4 bg-gray-600 rounded w-10"></div>
                    <div className="h-8 w-8 bg-gray-600 rounded-full"></div>
                    <div className="h-4 bg-gray-600 rounded w-12"></div>
                    <div className="h-3 bg-gray-600 rounded w-10"></div>
                </div>
            ))}
        </div>
    </div>
);

const ForecastDisplay: React.FC<{ forecast: DailyForecast[] | null }> = ({ forecast }) => {
    if (!forecast) {
        return <ForecastSkeleton />;
    }

    const getWeatherIcon = (icon: DailyForecast['icon']) => {
        switch(icon) {
            case 'sun': return <SunIcon />;
            case 'cloud': return <CloudIcon />;
            case 'rain': return <RainIcon />;
            case 'wind': return <WindIcon />;
            case 'partly-cloudy': return <PartlyCloudyIcon />;
            case 'snow': return <SnowIcon />;
            default: return <SunIcon />;
        }
    }

    const iconColor: { [key: string]: string } = {
        sun: 'text-yellow-400',
        cloud: 'text-gray-400',
        'partly-cloudy': 'text-yellow-400/70',
        rain: 'text-blue-400',
        wind: 'text-cyan-400',
        snow: 'text-white'
    };

    return (
      <div className="bg-gray-900/50 border border-gray-700/80 rounded-xl p-4 mt-6">
        <h3 className="font-semibold text-white mb-3 text-base">3-Day Forecast</h3>
        <div className="grid grid-cols-3 gap-2">
            {forecast.slice(0, 3).map((day, index) => (
                <div key={day.day} className={`flex flex-col items-center text-center p-2 rounded-lg ${index === 0 ? 'bg-blue-900/40' : 'bg-gray-700/30'}`}>
                    <p className="font-bold text-sm text-white">{day.day.substring(0,3)}</p>
                    <div className={`my-1.5 ${iconColor[day.icon] || 'text-gray-400'}`}>{getWeatherIcon(day.icon)}</div>
                    <p className="font-bold text-base text-white">{day.high}°<span className="text-gray-400">/{day.low}°</span></p>
                    <p className="text-xs text-gray-400 mt-1">{day.windSpeed} mph</p>
                </div>
            ))}
        </div>
      </div>
    );
  };

export const ControlsPanel: React.FC<ControlsPanelProps> = ({ 
    onSearch, isLoading, forecast,
    origin, setOrigin, destination, setDestination,
    bikeSpeed, setBikeSpeed, motorWattage, setMotorWattage,
    batteryVoltage, setBatteryVoltage
}) => {
  const [isLocating, setIsLocating] = useState<boolean>(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setOrigin('My Current Location');
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Could not get your location. Please ensure location services are enabled and permissions are granted.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-sm">
      <h2 className="text-lg font-bold text-white mb-1">Plan Your Ride</h2>
      <p className="text-sm text-gray-400 mb-5">Enter your route and e-bike speed for an accurate ETA.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="origin" className="block text-sm font-medium text-gray-300 mb-1">From</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <LocationIcon />
            </div>
            <input
              type="text"
              id="origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="e.g., Cheesman Park"
            />
             <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-blue-400 disabled:text-gray-500 disabled:cursor-wait transition-colors"
                aria-label="Use current location"
            >
                {isLocating ? (
                    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <CrosshairIcon />
                )}
            </button>
          </div>
        </div>
        
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-300 mb-1">To</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
               <LocationIcon isDestination={true}/>
            </div>
            <input
              type="text"
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="e.g., RiNo Art District"
            />
          </div>
        </div>
        
        <div className="pt-2">
          <label htmlFor="bike-speed" className="block text-sm font-medium text-gray-300 mb-2">
            Average E-Bike Speed
          </label>
          <div className="flex items-center space-x-4">
             <div className="text-blue-400"><SpeedIcon /></div>
            <input
              type="range"
              id="bike-speed"
              min="5"
              max="35"
              step="1"
              value={bikeSpeed}
              onChange={(e) => setBikeSpeed(Number(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-bold text-lg text-blue-400 w-16 text-center">{bikeSpeed} mph</span>
          </div>
        </div>

        <details className="group pt-2">
            <summary className="text-sm font-medium text-gray-400 cursor-pointer list-none flex items-center justify-between">
                <span>Advanced Options (Battery)</span>
                <svg className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="wattage" className="block text-xs font-medium text-gray-400 mb-1">Motor (Watts)</label>
                    <input type="number" id="wattage" value={motorWattage} onChange={e => setMotorWattage(e.target.value)} placeholder="e.g., 750" className="w-full px-3 py-2 text-sm bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"/>
                </div>
                 <div>
                    <label htmlFor="voltage" className="block text-xs font-medium text-gray-400 mb-1">Battery (Volts)</label>
                    <input type="number" id="voltage" value={batteryVoltage} onChange={e => setBatteryVoltage(e.target.value)} placeholder="e.g., 48" className="w-full px-3 py-2 text-sm bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"/>
                </div>
            </div>
        </details>

        <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-500 disabled:bg-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                'Find Route'
              )}
            </button>
        </div>
      </form>
       <ForecastDisplay forecast={forecast} />
    </div>
  );
};

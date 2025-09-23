import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ControlsPanel } from './components/ControlsPanel';
import { RouteInfoPanel } from './components/MapPanel';
import InteractiveMap from './components/InteractiveMap';
import { SocialPanel } from './components/SocialPanel';
import { getRouteInfo, getWeatherInfo } from './services/geminiService';
import { getInitialFriends, startLocationUpdates } from './services/socialService';
import type { RouteDetails, ChargingStation, WeatherInfo, User, Friend, Coordinates } from './types';
import { INITIAL_BIKE_SPEED } from './constants';
import { LoadingIcon, LogoIcon, EbikeIcon, WarningIcon, UserIcon } from './components/Icons';

declare const google: any;

const LoadingOverlay: React.FC = () => (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-900/70 backdrop-blur-sm">
        <div className="text-center p-8">
            <LoadingIcon />
            <h3 className="text-lg font-semibold text-white mt-4">Generating Your E-Bike Route...</h3>
            <p className="text-gray-400 mt-1">Calculating optimal paths and finding charge points.</p>
        </div>
    </div>
);

const WelcomeMessage: React.FC = () => (
    <div className="text-center p-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl pointer-events-auto max-w-md">
        <div className="text-blue-500 inline-block">
            <EbikeIcon />
        </div>
        <h3 className="text-xl font-bold text-white mt-4">Welcome to the E-Bike Navigator</h3>
        <p className="text-gray-300 mt-2">
            Plan your electric bike journey across Denver. The map has centered on your location. Use the panel on the left to get started.
        </p>
    </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center p-8 bg-red-900/80 backdrop-blur-sm rounded-2xl max-w-md shadow-2xl border border-red-500/50">
        <div className="text-red-400 inline-block">
            <WarningIcon />
        </div>
        <h3 className="text-xl font-bold text-white mt-4">Route Generation Failed</h3>
        <p className="text-red-200 mt-2">{message}</p>
    </div>
);

const App: React.FC = () => {
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [chargingStations, setChargingStations] = useState<ChargingStation[]>([]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form state lifted from ControlsPanel
  const [origin, setOrigin] = useState<string>('Union Station, Denver');
  const [destination, setDestination] = useState<string>('Denver Botanic Gardens');
  const [bikeSpeed, setBikeSpeed] = useState<number>(INITIAL_BIKE_SPEED);
  const [motorWattage, setMotorWattage] = useState<string>('');
  const [batteryVoltage, setBatteryVoltage] = useState<string>('');

  // Social and location features state
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friend[]>(getInitialFriends());
  const [isSocialPanelOpen, setIsSocialPanelOpen] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [friendToFocus, setFriendToFocus] = useState<Friend | null>(null);
  const weatherFetchedRef = useRef(false);

  useEffect(() => {
    const fetchWeather = async (coords?: Coordinates) => {
        try {
            const weatherData = await getWeatherInfo(coords?.lat, coords?.lng);
            setWeather(weatherData);
        } catch (err) {
            console.error('Failed to fetch weather data:', err);
        }
    };

    let watchId: number | null = null;
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setUserLocation(newLocation);
                if (!weatherFetchedRef.current) {
                    weatherFetchedRef.current = true;
                    fetchWeather(newLocation);
                }
            },
            (err) => {
                console.error("Geolocation error:", err);
                if (!weatherFetchedRef.current) {
                    weatherFetchedRef.current = true;
                    fetchWeather(); // Fetch default weather for Denver
                }
            },
            { enableHighAccuracy: true }
        );
    } else {
        // Geolocation not supported
        if (!weatherFetchedRef.current) {
            weatherFetchedRef.current = true;
            fetchWeather();
        }
    }

    const stopUpdates = startLocationUpdates(setFriends);
    
    return () => {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        stopUpdates();
    };
  }, []);

  const handleLoginSuccess = useCallback((credentialResponse: any) => {
    try {
      const token = credentialResponse.credential;
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));

      const loggedInUser: User = {
        username: decodedPayload.name,
        email: decodedPayload.email,
        picture: decodedPayload.picture,
      };
      setUser(loggedInUser);
      setIsSocialPanelOpen(false); // Close panel on successful login
    } catch (err) {
      console.error("Failed to decode JWT or set user:", err);
      setError("There was an error signing you in. Please try again.");
    }
  }, []);

  const handleSignOut = useCallback(() => {
    if (typeof google !== 'undefined') {
      google.accounts.id.disableAutoSelect();
    }
    setUser(null);
    setIsSocialPanelOpen(false);
  }, []);

  const handleSearch = useCallback(async (searchOrigin: string, searchDestination: string) => {
    if (!searchOrigin || !searchDestination) {
      setError('Please enter both an origin and a destination.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setRouteDetails(null);
    setChargingStations([]);

    let finalOrigin = searchOrigin;
    if (searchOrigin === 'My Current Location' && userLocation) {
        finalOrigin = `${userLocation.lat},${userLocation.lng}`;
    }

    try {
      const wattage = motorWattage ? Number(motorWattage) : undefined;
      const voltage = batteryVoltage ? Number(batteryVoltage) : undefined;
      const result = await getRouteInfo(finalOrigin, searchDestination, bikeSpeed, wattage, voltage);
      if (result) {
        setRouteDetails({
          ...result,
          bikeSpeed: bikeSpeed
        });
        setChargingStations(result.chargingStations);
      } else {
        throw new Error('Received no data from the service.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not generate the route. The model may be unavailable. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [bikeSpeed, motorWattage, batteryVoltage, userLocation]);
  
  const handleRouteToFriend = useCallback((friend: Friend) => {
    const friendLocationString = `${friend.location.lat}, ${friend.location.lng}`;
    setOrigin('My Current Location');
    setDestination(friend.username);
    handleSearch('My Current Location', friendLocationString);
  }, [handleSearch]);

  const handleViewFriendOnMap = useCallback((friend: Friend) => {
    setFriendToFocus(friend);
    setIsSocialPanelOpen(false);
  }, []);

  return (
    <div className="h-screen bg-gray-900 text-gray-200 antialiased relative">
      <div className="absolute inset-0 z-0">
        <InteractiveMap 
          userLocation={userLocation}
          routeDetails={routeDetails} 
          chargingStations={chargingStations}
          friends={friends}
          onRouteToFriend={handleRouteToFriend}
          friendToFocus={friendToFocus}
        />
      </div>

      <header className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-gray-900/80 to-transparent">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
             <LogoIcon />
             <h1 className="text-xl font-bold text-white tracking-tight">Denver E-Bike Navigator</h1>
          </div>
          <button 
            onClick={() => setIsSocialPanelOpen(true)} 
            className="p-1 rounded-full bg-gray-800/50 hover:bg-gray-700/70 transition-colors"
            aria-label="Open profile and friends panel"
          >
            {user ? (
                <img src={user.picture} alt={user.username} className="h-8 w-8 rounded-full" />
            ) : (
                <div className="p-1">
                    <UserIcon />
                </div>
            )}
          </button>
        </div>
      </header>

      <div className="absolute top-24 left-4 z-10">
        <ControlsPanel 
          onSearch={() => handleSearch(origin, destination)} 
          isLoading={isLoading} 
          weather={weather}
          origin={origin}
          setOrigin={setOrigin}
          destination={destination}
          setDestination={setDestination}
          bikeSpeed={bikeSpeed}
          setBikeSpeed={setBikeSpeed}
          motorWattage={motorWattage}
          setMotorWattage={setMotorWattage}
          batteryVoltage={batteryVoltage}
          setBatteryVoltage={setBatteryVoltage}
        />
      </div>
      
      <SocialPanel
          isOpen={isSocialPanelOpen}
          onClose={() => setIsSocialPanelOpen(false)}
          user={user}
          friends={friends}
          onLoginSuccess={handleLoginSuccess}
          onSignOut={handleSignOut}
          onViewFriendOnMap={handleViewFriendOnMap}
      />

      {!isLoading && routeDetails && !error && (
        <div className="absolute top-24 right-4 z-10">
          <RouteInfoPanel routeDetails={routeDetails} />
        </div>
      )}
      
      {isLoading && <LoadingOverlay />}

      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        {!isLoading && !routeDetails && !error && <WelcomeMessage />}
        {error && <ErrorMessage message={error} />}
      </div>
    </div>
  );
};

export default App;

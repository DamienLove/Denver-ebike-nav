import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import ReactDOMServer from 'react-dom/server';
import type { RouteDetails, ChargingStation, Friend, Coordinates } from '../types';
import { PinIcon, StationIcon, UserLocationIcon } from './Icons';

// Leaflet is loaded from a CDN, so we inform TypeScript that L is a global variable.
declare const L: any;

const FriendLocationIcon: React.FC<{ name: string }> = ({ name }) => (
    <div className="relative flex items-center justify-center w-8 h-8">
        <div className="absolute w-8 h-8 rounded-full bg-purple-600 border-2 border-white shadow-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm select-none">{name.charAt(0).toUpperCase()}</span>
        </div>
    </div>
);

const createIcon = (
    iconComponent: React.ReactElement,
    className: string = '',
    anchor: [number, number] = [16, 32]
) => {
    return L.divIcon({
        html: ReactDOMServer.renderToString(iconComponent),
        className: `bg-transparent border-none ${className}`,
        iconSize: [32, 32],
        iconAnchor: anchor,
        popupAnchor: [0, -anchor[1]],
    });
};

const originIcon = createIcon(<PinIcon />, 'text-green-500');
const destinationIcon = createIcon(<PinIcon />, 'text-red-500');
const stationIcon = createIcon(<StationIcon />, 'text-yellow-500');
const userLocationIcon = createIcon(<UserLocationIcon />, '', [16, 16]);
const getFriendIcon = (name: string) => createIcon(<FriendLocationIcon name={name} />, '', [16, 16]);

// FIX: Added a decodePolyline function to decode Google Maps encoded polyline strings, resolving the 'Cannot find name' error.
/**
 * Decodes an encoded polyline string into an array of lat/lng coordinates.
 * @param encoded The encoded polyline string.
 * @returns An array of [latitude, longitude] pairs.
 */
function decodePolyline(encoded: string): [number, number][] {
    if (!encoded) {
        return [];
    }

    let index = 0;
    let lat = 0;
    let lng = 0;
    const coordinates: [number, number][] = [];
    let shift = 0;
    let result = 0;
    let byte: number;
    let latitude_change: number;
    let longitude_change: number;

    while (index < encoded.length) {
        shift = 0;
        result = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += latitude_change;

        shift = 0;
        result = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += longitude_change;

        coordinates.push([lat / 1e5, lng / 1e5]);
    }

    return coordinates;
}

interface InteractiveMapProps {
  userLocation: Coordinates | null;
  routeDetails: RouteDetails | null;
  chargingStations: ChargingStation[];
  friends: Friend[];
  onRouteToFriend: (friend: Friend) => void;
  friendToFocus: Friend | null;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ userLocation, routeDetails, chargingStations, friends, onRouteToFriend, friendToFocus }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any | null>(null);
    const routeLayerRef = useRef<any | null>(null);
    const userLocationMarkerRef = useRef<any | null>(null);
    const friendMarkersRef = useRef<Map<string, any>>(new Map());
    const hasCenteredMap = useRef<boolean>(false);

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current, {
                center: [39.7392, -104.9903], // Denver coordinates
                zoom: 12,
                zoomControl: false,
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(mapRef.current);

            L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
        }
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !userLocation) return;

        const latLng: [number, number] = [userLocation.lat, userLocation.lng];

        if (!userLocationMarkerRef.current) {
            userLocationMarkerRef.current = L.marker(latLng, { icon: userLocationIcon }).addTo(map);
        } else {
            userLocationMarkerRef.current.setLatLng(latLng);
        }

        if (!hasCenteredMap.current) {
            map.flyTo(latLng, 14, { duration: 1.5 });
            hasCenteredMap.current = true;
        }
    }, [userLocation]);


    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        
        friends.forEach(friend => {
            if (!friend.isOnline) {
                if (friendMarkersRef.current.has(friend.id)) {
                    friendMarkersRef.current.get(friend.id).remove();
                    friendMarkersRef.current.delete(friend.id);
                }
                return;
            }

            const latLng: [number, number] = [friend.location.lat, friend.location.lng];
            if (friendMarkersRef.current.has(friend.id)) {
                friendMarkersRef.current.get(friend.id).setLatLng(latLng);
            } else {
                const marker = L.marker(latLng, { icon: getFriendIcon(friend.username) }).addTo(map);
                
                const popupContent = document.createElement('div');
                const root = createRoot(popupContent);
                root.render(
                    <div className="text-center">
                        <p className="font-bold text-base mb-2">{friend.username}</p>
                        <button
                          id={`route-btn-${friend.id}`}
                          className="bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg text-sm hover:bg-blue-500 transition-colors"
                        >
                            Route to {friend.username}
                        </button>
                    </div>
                );

                marker.bindPopup(popupContent);
                marker.on('popupopen', () => {
                    document.getElementById(`route-btn-${friend.id}`)?.addEventListener('click', () => {
                        onRouteToFriend(friend);
                        map.closePopup();
                    });
                });
                
                friendMarkersRef.current.set(friend.id, marker);
            }
        });

    }, [friends, onRouteToFriend]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (routeLayerRef.current) routeLayerRef.current.clearLayers();
        else routeLayerRef.current = L.featureGroup().addTo(map);

        if (routeDetails) {
            const path = decodePolyline(routeDetails.polyline);
            const polyline = L.polyline(path, { color: '#3B82F6', weight: 6, opacity: 0.9 }).addTo(routeLayerRef.current);
            
            const originMarker = L.marker(
                [routeDetails.origin.location.lat, routeDetails.origin.location.lng],
                { icon: originIcon }
            ).bindPopup(`<b>Start:</b> ${routeDetails.origin.name}`);

            const destinationMarker = L.marker(
                [routeDetails.destination.location.lat, routeDetails.destination.location.lng],
                { icon: destinationIcon }
            ).bindPopup(`<b>End:</b> ${routeDetails.destination.name}`);
            
            originMarker.addTo(routeLayerRef.current);
            destinationMarker.addTo(routeLayerRef.current);
            
            chargingStations.forEach(station => {
                L.marker([station.location.lat, station.location.lng], { icon: stationIcon })
                  .bindPopup(`<b>${station.name}</b><br>${station.address}`)
                  .addTo(routeLayerRef.current!);
            });

            map.flyToBounds(polyline.getBounds().pad(0.1), {
                duration: 1.5,
                easeLinearity: 0.25,
            });
        }
    }, [routeDetails, chargingStations]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !friendToFocus) return;
    
        const friendMarker = friendMarkersRef.current.get(friendToFocus.id);
    
        map.flyTo([friendToFocus.location.lat, friendToFocus.location.lng], 16, { duration: 1.5 });
    
        if (friendMarker) {
          // Use a timeout to open the popup after the fly-to animation is mostly done.
          const timer = setTimeout(() => {
            friendMarker.openPopup();
          }, 1000);
          return () => clearTimeout(timer);
        }
      }, [friendToFocus]);


  return (
    <div ref={mapContainerRef} className="w-full h-full" />
  );
};

export default InteractiveMap;

import React from 'react';
import type { RouteDetails } from '../types';
import { ClockIcon, RouteIcon, ZapIcon, BatteryUsageIcon, DirectionsIcon, FinishFlagIcon } from './Icons';

const RouteSummary: React.FC<{ details: RouteDetails }> = ({ details }) => (
    <div className="p-4 border-b border-gray-700/80 flex-shrink-0">
        <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-2 rounded-lg bg-gray-700/50">
                <div className="flex items-center justify-center text-blue-400 mb-1"><ClockIcon /></div>
                <p className="font-bold text-lg text-white">{details.duration} <span className="text-sm font-medium">min</span></p>
                <p className="text-xs text-blue-400">Duration</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-700/50">
                <div className="flex items-center justify-center text-green-400 mb-1"><RouteIcon /></div>
                <p className="font-bold text-lg text-white">{details.distance.toFixed(1)} <span className="text-sm font-medium">mi</span></p>
                <p className="text-xs text-green-400">Distance</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-700/50">
                <div className="flex items-center justify-center text-yellow-400 mb-1"><ZapIcon /></div>
                <p className="font-bold text-lg text-white">{details.bikeSpeed} <span className="text-sm font-medium">mph</span></p>
                <p className="text-xs text-yellow-400">Avg Speed</p>
            </div>
            <div className={`p-2 rounded-lg ${details.batteryUsage ? 'bg-gray-700/50' : 'bg-gray-800/50'}`}>
                <div className={`flex items-center justify-center mb-1 ${details.batteryUsage ? 'text-purple-400' : 'text-gray-500'}`}><BatteryUsageIcon /></div>
                <p className={`font-bold text-lg ${details.batteryUsage ? 'text-white' : 'text-gray-400'}`}>{details.batteryUsage ? `${details.batteryUsage}%` : 'N/A'}</p>
                <p className={`text-xs ${details.batteryUsage ? 'text-purple-400' : 'text-gray-500'}`}>Battery</p>
            </div>
        </div>
    </div>
);

const EstimatedArrivalTime: React.FC<{ duration: number }> = ({ duration }) => {
  const eta = React.useMemo(() => {
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + duration * 60000); // duration in minutes
    return arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [duration]);

  return (
    <div className="px-4 pt-3 pb-3 border-b border-gray-700/80">
        <div className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg">
            <div className="flex items-center space-x-3">
                <div className="text-blue-400">
                    <FinishFlagIcon />
                </div>
                <span className="font-semibold text-gray-200">Estimated Arrival</span>
            </div>
            <span className="font-bold text-lg text-white">{eta}</span>
        </div>
    </div>
  );
};


const DirectionsList: React.FC<{ directions: string[] }> = ({ directions }) => (
    <div className="p-4">
        <h4 className="font-bold text-white mb-3 flex items-center text-base">
            <DirectionsIcon className="mr-2"/> Turn-by-Turn Directions
        </h4>
        <ol className="list-decimal list-inside space-y-2.5 text-sm text-gray-300">
            {directions.map((step, index) => (
                <li key={index} className="pl-2 leading-relaxed">{step}</li>
            ))}
        </ol>
    </div>
);


export const RouteInfoPanel: React.FC<{ routeDetails: RouteDetails }> = ({ routeDetails }) => {
  return (
    <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[calc(100vh-8rem)]">
      <RouteSummary details={routeDetails} />
      <EstimatedArrivalTime duration={routeDetails.duration} />
      {routeDetails.directions && routeDetails.directions.length > 0 && (
         <div className="flex-grow overflow-y-auto custom-scrollbar">
            <DirectionsList directions={routeDetails.directions} />
         </div>
      )}
    </div>
  );
};
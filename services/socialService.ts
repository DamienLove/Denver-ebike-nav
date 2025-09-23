import type { Friend } from '../types';

const initialFriends: Friend[] = [
    { id: 'friend-1', username: 'Alex', location: { lat: 39.75, lng: -104.99 }, isOnline: true },
    { id: 'friend-2', username: 'Jess', location: { lat: 39.74, lng: -105.02 }, isOnline: true },
    { id: 'friend-3', username: 'Mike', location: { lat: 39.73, lng: -104.98 }, isOnline: true },
    { id: 'friend-4', username: 'Chloe', location: { lat: 39.76, lng: -104.95 }, isOnline: false },
];

export function getInitialFriends(): Friend[] {
    return initialFriends;
}

// Simulates friends moving around randomly
function updateFriendLocations(friends: Friend[]): Friend[] {
    return friends.map(friend => {
        if (friend.isOnline) {
            return {
                ...friend,
                location: {
                    lat: friend.location.lat + (Math.random() - 0.5) * 0.001,
                    lng: friend.location.lng + (Math.random() - 0.5) * 0.001,
                },
            };
        }
        return friend;
    });
}

/**
 * Starts a timer to periodically update friend locations.
 * @param setFriends The React state setter function to call with updated friend data.
 * @returns A function to clear the interval timer.
 */
export function startLocationUpdates(setFriends: React.Dispatch<React.SetStateAction<Friend[]>>): () => void {
    const intervalId = setInterval(() => {
        setFriends(prevFriends => updateFriendLocations(prevFriends));
    }, 3000); // Update every 3 seconds

    return () => clearInterval(intervalId);
}

import React, { useState, useEffect } from 'react';
import type { User, Friend } from '../types';
import { UserIcon, UsersIcon, SearchIcon, UserPlusIcon, SignOutIcon, MapPinIcon, GoogleIcon } from './Icons';
import { addFriendByEmail } from '../services/socialService';


interface SocialPanelProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    friends: Friend[];
    onSignIn: () => void;
    onSignOut: () => void;
    onViewFriendOnMap: (friend: Friend) => void;
}

const FriendListItem: React.FC<{ friend: Friend, onViewOnMap: (friend: Friend) => void }> = ({ friend, onViewOnMap }) => (
    <li className="flex items-center justify-between py-3">
        <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white font-bold text-lg">
                {friend.username.charAt(0).toUpperCase()}
                 <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ${friend.isOnline ? 'bg-green-500' : 'bg-gray-500'} ring-2 ring-gray-700`}></span>
            </div>
            <div>
                <p className="font-medium text-white">{friend.username}</p>
                <p className="text-sm text-gray-400">{friend.isOnline ? 'Online' : 'Offline'}</p>
            </div>
        </div>
        {friend.isOnline && (
            <button
                onClick={() => onViewOnMap(friend)}
                className="p-2 text-gray-400 hover:text-blue-400 rounded-full hover:bg-gray-700/60 transition-colors"
                aria-label={`View ${friend.username} on map`}
            >
                <MapPinIcon />
            </button>
        )}
    </li>
);

export const SocialPanel: React.FC<SocialPanelProps> = ({ isOpen, onClose, user, friends, onSignIn, onSignOut, onViewFriendOnMap }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [newFriendEmail, setNewFriendEmail] = useState('');
    const [addFriendStatus, setAddFriendStatus] = useState<{message: string; isError: boolean} | null>(null);

    const handleAddFriendSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFriendEmail.trim() || !user) return;

        setAddFriendStatus(null);
        try {
            const result = await addFriendByEmail(user.uid, newFriendEmail);
            setAddFriendStatus({ message: result, isError: false });
            setNewFriendEmail('');
        } catch (error: any) {
            setAddFriendStatus({ message: error.message, isError: true });
        }
    };

    const filteredFriends = friends.filter(friend => 
        friend.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-gray-800/90 backdrop-blur-lg shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <header className="flex items-center justify-between p-4 border-b border-gray-700/80 flex-shrink-0">
                        <h2 className="text-lg font-bold text-white">Profile & Friends</h2>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors" aria-label="Close panel">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </header>

                    {user ? (
                         <>
                            <div className="p-6 border-b border-gray-700/80">
                                <div className="flex items-center space-x-4">
                                    {user.picture ? (
                                        <img src={user.picture} alt={user.username || 'User'} className="h-16 w-16 rounded-full"/>
                                    ): (
                                        <div className="h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center">
                                            <UserIcon />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{user.username}</h3>
                                        <p className="text-sm text-gray-400">{user.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onSignOut}
                                    className="mt-4 w-full flex items-center justify-center py-2 px-4 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-semibold"
                                >
                                    <SignOutIcon />
                                    Sign Out
                                </button>
                            </div>
                            <div className="flex-grow p-6 overflow-y-auto custom-scrollbar">
                                <h3 className="text-base font-semibold text-white mb-4 flex items-center">
                                    <UsersIcon />
                                    <span className="ml-2">Your Crew</span>
                                </h3>
                                <div className="relative mb-4">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <SearchIcon />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Find a friend..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    />
                                </div>
                                <ul className="divide-y divide-gray-700/60 mb-6">
                                    {filteredFriends.length > 0 ? (
                                        filteredFriends.map(friend => <FriendListItem key={friend.id} friend={friend} onViewOnMap={onViewFriendOnMap} />)
                                    ) : (
                                        <p className="text-center text-gray-400 py-4">No friends found.</p>
                                    )}
                                </ul>
                                <form onSubmit={handleAddFriendSubmit}>
                                    <label htmlFor="add-friend" className="block text-sm font-medium text-gray-300 mb-2">Add by Email</label>
                                    <div className="flex space-x-2">
                                        <input
                                            type="email"
                                            id="add-friend"
                                            value={newFriendEmail}
                                            onChange={(e) => setNewFriendEmail(e.target.value)}
                                            className="flex-grow pl-3 pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                            placeholder="e.g., friend@example.com"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newFriendEmail.trim()}
                                            className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
                                            aria-label="Send friend request"
                                        >
                                            <UserPlusIcon />
                                        </button>
                                    </div>
                                    {addFriendStatus && (
                                        <p className={`mt-2 text-sm ${addFriendStatus.isError ? 'text-red-400' : 'text-green-400'}`}>{addFriendStatus.message}</p>
                                    )}
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-grow p-6 text-center">
                            <div className="text-blue-500">
                                <UsersIcon/>
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-white">Join Your Crew</h3>
                            <p className="mt-1 text-gray-400 text-sm max-w-xs">Sign in to see your friends on the map and plan group rides.</p>
                            <button
                                onClick={onSignIn}
                                className="mt-6 flex items-center justify-center bg-white text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-gray-200 transition-colors shadow-md"
                            >
                                <GoogleIcon />
                                <span className="ml-3">Sign in with Google</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
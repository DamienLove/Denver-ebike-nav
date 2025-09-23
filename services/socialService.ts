import type { Dispatch, SetStateAction } from 'react';
import type { Friend, Coordinates, User } from '../types';
import firebase, { auth, firestore } from './firebase';

export const signInWithGoogle = async (): Promise<void> => {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
};

export const signOut = async (): Promise<void> => {
    await auth.signOut();
};

export const updateUserProfileOnLogin = async (user: firebase.User): Promise<void> => {
    const userRef = firestore.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        await userRef.set({
            uid: user.uid,
            username: user.displayName,
            email: user.email,
            picture: user.photoURL,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
};

export const setUserOnlineStatus = (uid: string, isOnline: boolean): void => {
    const userRef = firestore.collection('users').doc(uid);
    userRef.update({ isOnline, lastSeen: firebase.firestore.FieldValue.serverTimestamp() })
        .catch(err => console.error("Error updating online status:", err));
};

export const updateUserLocation = (uid: string, location: Coordinates): void => {
    const userRef = firestore.collection('users').doc(uid);
    userRef.update({ location })
        .catch(err => console.error("Error updating location:", err));
};

export const addFriendByEmail = async (currentUserId: string, friendEmail: string): Promise<string> => {
    if (!friendEmail) throw new Error("Email cannot be empty.");

    const usersRef = firestore.collection('users');
    const querySnapshot = await usersRef.where('email', '==', friendEmail).limit(1).get();

    if (querySnapshot.empty) {
        throw new Error("User with that email not found.");
    }

    const friendDoc = querySnapshot.docs[0];
    const friendId = friendDoc.id;
    const friendData = friendDoc.data();

    if (friendId === currentUserId) {
        throw new Error("You can't add yourself as a friend.");
    }

    const currentUserFriendsRef = usersRef.doc(currentUserId).collection('friends').doc(friendId);
    const friendUserFriendsRef = usersRef.doc(friendId).collection('friends').doc(currentUserId);

    // Add friend to current user's friend list
    await currentUserFriendsRef.set({
        uid: friendId,
        username: friendData.username,
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Add current user to friend's friend list
    const currentUserDoc = await usersRef.doc(currentUserId).get();
    const currentUserData = currentUserDoc.data();
    await friendUserFriendsRef.set({
        uid: currentUserId,
        username: currentUserData?.username,
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return `Successfully added ${friendData.username} as a friend!`;
};


export const streamFriendsData = (uid: string, setFriends: Dispatch<SetStateAction<Friend[]>>): (() => void) => {
    const friendsRef = firestore.collection('users').doc(uid).collection('friends');

    const unsubscribeFromFriendsList = friendsRef.onSnapshot(async snapshot => {
        if (snapshot.empty) {
            setFriends([]);
            return;
        }

        const friendUids = snapshot.docs.map(doc => doc.id);

        const usersRef = firestore.collection('users');
        const unsubscribeFromFriendDetails = usersRef.where(firebase.firestore.FieldPath.documentId(), 'in', friendUids)
            .onSnapshot(usersSnapshot => {
                const friendsData = usersSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        username: data.username || 'No Name',
                        location: data.location || { lat: 0, lng: 0 },
                        isOnline: data.isOnline || false,
                    };
                });
                setFriends(friendsData);
            });

        return () => unsubscribeFromFriendDetails();
    });

    return () => unsubscribeFromFriendsList();
};

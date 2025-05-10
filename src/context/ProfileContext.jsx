// src/context/ProfileContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import defaultAvatar from '../assets/user.jpg';

const getBackendBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    return apiUrl.replace(/\/api\/?$/, '');
};
const backendBaseUrl = getBackendBaseUrl();

const ProfileContext = createContext({
    userProfile: null,
    isLoadingProfile: true,
    profileError: null,
    updateUserProfilePic: () => {},
    refreshProfile: () => {},
    getFullProfileImageUrl: () => defaultAvatar,
    isAuthenticated: false,
    setIsAuthenticated: () => {},
    setUserProfile: () => {},
});

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider. Check App.jsx.');
    }
    return context;
};

export const ProfileProvider = ({ children }) => {
    const [userProfile, setUserProfile] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('authToken'));

    // --- fetchUserProfile ---
    // Dependencies: ONLY isAuthenticated.
    // We don't need `userProfile` as a dependency here because the `if (!forceRefresh && userProfile)`
    // check uses the *current* `userProfile` from the closure, which is fine.
    // Removing `userProfile` from this useCallback's dependency array is KEY to breaking the loop.
    const fetchUserProfile = useCallback(async (forceRefresh = false) => {
        const tokenExists = !!localStorage.getItem('authToken');
        if (!tokenExists) {
            console.log("ProfileContext (fetch): No token. Clearing state.");
            setUserProfile(null); setProfileError(null); setIsLoadingProfile(false);
            if (isAuthenticated) setIsAuthenticated(false); // Sync auth state
            return;
        }

        // Access userProfile directly from the state here for the check.
        // This avoids making fetchUserProfile dependent on userProfile changing.
        if (!forceRefresh && userProfile_ref.current) { // Use a ref for the check
            console.log("ProfileContext (fetch): Profile exists & no force. Skipping.");
            setIsLoadingProfile(false);
            return;
        }

        console.log("ProfileContext (fetch): Fetching student profile...");
        setIsLoadingProfile(true); setProfileError(null);
        try {
            const response = await api.get('/student/profile');
            setUserProfile(response.data); // This will trigger re-render of consumers
            console.log("ProfileContext (fetch): Student profile loaded.", response.data);
        } catch (error) {
            console.error("ProfileContext (fetch): Error fetching student profile:", error);
            if (error.response?.status !== 401) {
                setProfileError(error.response?.data?.message || "Failed to load profile.");
            }
        } finally {
            setIsLoadingProfile(false);
        }
    }, [isAuthenticated]); // Removed userProfile_ref from here, using the ref for the check

    // Create a ref to hold the current userProfile for the check inside fetchUserProfile
    const userProfile_ref = useRef(userProfile);
    useEffect(() => {
        userProfile_ref.current = userProfile;
    }, [userProfile]);


    // --- useEffect to call fetchUserProfile ---
    // Dependencies: ONLY isAuthenticated and the fetchUserProfile function itself.
    // fetchUserProfile is stable because its dependencies are stable.
    useEffect(() => {
        console.log("ProfileContext useEffect[isAuthenticated]: Auth status is", isAuthenticated);
        if (isAuthenticated) {
            fetchUserProfile(); // Fetch if authenticated
        } else {
            setUserProfile(null); setProfileError(null); setIsLoadingProfile(false);
        }
    }, [isAuthenticated, fetchUserProfile]); // fetchUserProfile's identity is stable

    // --- Context Actions (these should be stable) ---
    const updateUserProfilePic = useCallback((newPicPath) => {
        setUserProfile(prevProfile => {
            if (!prevProfile) return null;
            const currentSubProfile = prevProfile.profile || {};
            return { ...prevProfile, profile: { ...currentSubProfile, profilePic: newPicPath } };
        });
    }, []); // Empty dependency array makes this function stable

    const refreshProfile = useCallback(() => {
        console.log("ProfileContext: Manual refreshProfile triggered.");
        fetchUserProfile(true);
    }, [fetchUserProfile]); // Depends on stable fetchUserProfile

    const getFullProfileImageUrl = useCallback(() => {
        const profilePicPath = userProfile_ref.current?.profile?.profilePic; // Use ref here too
        return profilePicPath ? `${backendBaseUrl}${profilePicPath}` : defaultAvatar;
    }, []); // Re-create only if base URL or avatar changes (unlikely) OR make dependent on userProfile_ref.current?.profile?.profilePic

    // This effect ensures getFullProfileImageUrl re-memoizes if the specific pic path changes
    const memoizedGetFullProfileImageUrl = React.useMemo(() => {
        return () => {
            const profilePicPath = userProfile?.profile?.profilePic;
            return profilePicPath ? `${backendBaseUrl}${profilePicPath}` : defaultAvatar;
        };
    }, [userProfile?.profile?.profilePic]);


    const value = React.useMemo(() => ({
        userProfile,
        isLoadingProfile,
        profileError,
        updateUserProfilePic,
        refreshProfile,
        getFullProfileImageUrl: memoizedGetFullProfileImageUrl, // Use the memoized version
        isAuthenticated,
        setIsAuthenticated,
        setUserProfile,
    }), [
        userProfile, isLoadingProfile, profileError,
        updateUserProfilePic, refreshProfile, memoizedGetFullProfileImageUrl,
        isAuthenticated, setIsAuthenticated, setUserProfile
    ]);

    console.log("ProfileProvider rendering. Auth:", value.isAuthenticated, "Profile:", value.userProfile ? "Loaded" : "Null", "Loading:", isLoadingProfile);

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};
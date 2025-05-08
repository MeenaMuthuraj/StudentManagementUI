// src/context/ProfileContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api'; // Ensure this path is correct
import defaultAvatar from '../assets/user.jpg'; // Ensure this path is correct

// Helper to get base URL for constructing image paths
const getBackendBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    return apiUrl.replace(/\/api\/?$/, '');
};
const backendBaseUrl = getBackendBaseUrl();

// 1. Create the Context
// Provide an initial default value structure. This helps prevent the "undefined" error
// if a component accidentally tries to use the context outside the provider,
// although the goal is always to use it within the provider.
const ProfileContext = createContext({
    userProfile: null,
    isLoadingProfile: true,
    profileError: null,
    updateUserProfilePic: () => {}, // No-op default function
    refreshProfile: () => {},      // No-op default function
    getFullProfileImageUrl: () => defaultAvatar, // Default function returns default image
    isAuthenticated: false,
    setIsAuthenticated: () => {}, // No-op default function
    setUserProfile: () => {},       // No-op default function
});

// 2. Custom Hook for easy consumption
export const useProfile = () => useContext(ProfileContext);

// 3. Context Provider Component (Manages the actual state)
export const ProfileProvider = ({ children }) => {
    const [userProfile, setUserProfile] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState(null);
    // Initialize isAuthenticated based on token presence
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('authToken'));

    // Memoized function to fetch profile data
    const fetchUserProfile = useCallback(async (forceRefresh = false) => {
        // Only fetch if authenticated AND (profile isn't loaded yet OR forceRefresh is true)
        const tokenExists = !!localStorage.getItem('authToken'); // Re-check token just in case
        if (!tokenExists || (!forceRefresh && userProfile)) {
            setIsLoadingProfile(false);
            // If not authenticated, ensure profile state is null
            if (!tokenExists) setUserProfile(null);
            return;
        }

        console.log("ProfileContext: Fetching user profile...");
        setIsLoadingProfile(true);
        setProfileError(null);
        try {
            // Assuming '/student/profile' - adjust if needed for different user types later
            const response = await api.get('/student/profile');
            setUserProfile(response.data);
            console.log("ProfileContext: Profile loaded.", response.data);
        } catch (error) {
            console.error("ProfileContext: Error fetching profile:", error);
             if (error.response?.status !== 401) { // Don't set error for expected unauthorized redirect
                setProfileError(error.response?.data?.message || "Failed to load profile data.");
            }
            // Optionally clear profile on error, or keep stale data?
            // setUserProfile(null);
        } finally {
            setIsLoadingProfile(false);
        }
    }, [isAuthenticated, userProfile]); // Include userProfile to allow re-fetching if it's nullified

    // Effect to fetch profile when isAuthenticated changes
    useEffect(() => {
        console.log("ProfileContext: Auth status changed or initial load. IsAuthenticated:", isAuthenticated);
        if (isAuthenticated) {
            // Reset profile state before fetching if needed (e.g., after login)
            // setUserProfile(null); // Optional: uncomment if you want to force fetch on every auth change
            fetchUserProfile();
        } else {
            // Ensure profile is cleared if user becomes unauthenticated
            setUserProfile(null);
            setProfileError(null);
            setIsLoadingProfile(false); // Not loading if not authenticated
        }
    }, [isAuthenticated, fetchUserProfile]);

    // --- Context Actions ---
    const updateUserProfilePic = (newPicPath) => {
        setUserProfile(prevProfile => {
            if (!prevProfile) return null;
            return {
                ...prevProfile,
                profile: { ...prevProfile.profile, profilePic: newPicPath }
            };
        });
        console.log("ProfileContext: Updated profilePic path to", newPicPath);
    };

    const refreshProfile = useCallback(() => {
         console.log("ProfileContext: Refresh triggered.");
        fetchUserProfile(true); // Force refresh
    }, [fetchUserProfile]);

    // Helper to get full image URL
    const getFullProfileImageUrl = useCallback(() => {
        const profilePicPath = userProfile?.profile?.profilePic;
        return profilePicPath ? `${backendBaseUrl}${profilePicPath}` : defaultAvatar;
    }, [userProfile?.profile?.profilePic]); // Depend only on the specific field

    // Memoize the context value to prevent unnecessary re-renders of consumers
    const value = React.useMemo(() => ({
        userProfile,
        isLoadingProfile,
        profileError,
        updateUserProfilePic,
        refreshProfile,
        getFullProfileImageUrl,
        isAuthenticated,
        setIsAuthenticated, // Expose setter for login/logout components
        setUserProfile     // Expose setter for login components
    }), [
        userProfile, isLoadingProfile, profileError,
        updateUserProfilePic, refreshProfile, getFullProfileImageUrl,
        isAuthenticated, setIsAuthenticated, setUserProfile
    ]); // Include all provided values in dependency array

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};
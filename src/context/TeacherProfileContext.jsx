// src/context/TeacherProfileContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api'; // Ensure this path is correct
import defaultAvatar from '../assets/user.jpg'; // Default avatar (use a teacher-specific one if available)

// Helper to get base URL for images
const getBackendBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    return apiUrl.replace(/\/api\/?$/, '');
};
const backendBaseUrl = getBackendBaseUrl();

// Create context with default values
const TeacherProfileContext = createContext({
    teacherProfile: null,
    isLoadingTeacherProfile: true,
    teacherProfileError: null,
    updateTeacherProfilePic: () => {}, // Placeholder function
    refreshTeacherProfile: () => {}, // Placeholder function
    getFullTeacherProfileImageUrl: () => defaultAvatar, // Default image function
    isTeacherAuthenticated: false, // Needs to be managed (perhaps by a separate AuthContext)
    // Add setters if needed by other components (like login)
});

// Custom hook for easy consumption
export const useTeacherProfile = () => useContext(TeacherProfileContext);

// Provider component
export const TeacherProfileProvider = ({ children }) => {
    const [teacherProfile, setTeacherProfile] = useState(null);
    const [isLoadingTeacherProfile, setIsLoadingTeacherProfile] = useState(true);
    const [teacherProfileError, setTeacherProfileError] = useState(null);
    // Track authentication status (ideally from a shared AuthContext or check token)
    const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(() => !!localStorage.getItem('authToken'));

    // Fetch TEACHER profile data
    const fetchTeacherProfile = useCallback(async (forceRefresh = false) => {
        // Ensure user is authenticated before fetching
        const tokenExists = !!localStorage.getItem('authToken');
        if (!tokenExists) {
             setIsTeacherAuthenticated(false); // Ensure state reflects reality
             setTeacherProfile(null);
             setIsLoadingTeacherProfile(false);
             return;
        }
        // Update auth state if token exists but state is false
        if (!isTeacherAuthenticated) setIsTeacherAuthenticated(true);

        // Avoid refetch if data exists and not forced
        if (!forceRefresh && teacherProfile) {
            setIsLoadingTeacherProfile(false);
            return;
        }

        console.log("TeacherProfileContext: Fetching teacher profile...");
        setIsLoadingTeacherProfile(true);
        setTeacherProfileError(null);
        try {
            // *** FETCH FROM TEACHER ENDPOINT ***
            const response = await api.get('/teacher/profile');
            setTeacherProfile(response.data);
            console.log("TeacherProfileContext: Teacher profile loaded.", response.data);
        } catch (error) {
            console.error("TeacherProfileContext: Error fetching teacher profile:", error);
            // Don't show error if it's 401 (interceptor handles redirect)
            if (error.response?.status !== 401) {
                setTeacherProfileError(error.response?.data?.message || "Failed to load teacher profile data.");
            }
            // Keep existing profile data on error? Or clear it?
            // setTeacherProfile(null);
        } finally {
            setIsLoadingTeacherProfile(false);
        }
        // Dependency: only isTeacherAuthenticated needed; fetchTeacherProfile defined outside relies on it
    }, [isTeacherAuthenticated, teacherProfile]); // Add teacherProfile to allow re-fetch if it's cleared

    // Effect to fetch profile when authentication status changes (or on initial load)
    useEffect(() => {
        console.log("TeacherProfileContext: Auth check/change. IsAuthenticated:", isTeacherAuthenticated);
        if (isTeacherAuthenticated) {
            fetchTeacherProfile(); // Fetch if authenticated
        } else {
            // Clear profile data if not authenticated
            setTeacherProfile(null);
            setTeacherProfileError(null);
            setIsLoadingTeacherProfile(false);
        }
    }, [isTeacherAuthenticated, fetchTeacherProfile]); // Rerun if auth status or fetch function changes

    // Action to update profile pic path in context state
    const updateTeacherProfilePic = (newPicPath) => {
        setTeacherProfile(prevProfile => {
            if (!prevProfile) return null;
            // Ensure profile sub-document exists before updating
            const currentSubProfile = prevProfile.profile || {};
            return {
                ...prevProfile,
                profile: { ...currentSubProfile, profilePic: newPicPath }
            };
        });
        console.log("TeacherProfileContext: Updated teacher profilePic path to", newPicPath);
    };

    // Action to trigger a manual profile refresh
    const refreshTeacherProfile = useCallback(() => {
        console.log("TeacherProfileContext: Refresh triggered.");
        fetchTeacherProfile(true); // Force refresh
    }, [fetchTeacherProfile]);

    // Helper to get the full image URL
    const getFullTeacherProfileImageUrl = useCallback(() => {
        const profilePicPath = teacherProfile?.profile?.profilePic;
        return profilePicPath ? `${backendBaseUrl}${profilePicPath}` : defaultAvatar;
    }, [teacherProfile?.profile?.profilePic]); // Dependency on the specific path

    // Memoize the value provided by the context
    const value = React.useMemo(() => ({
        teacherProfile,
        isLoadingTeacherProfile,
        teacherProfileError,
        updateTeacherProfilePic,
        refreshTeacherProfile,
        getFullTeacherProfileImageUrl,
        isTeacherAuthenticated,
        // Expose setters if needed by login/logout components
        // setIsTeacherAuthenticated,
        // setTeacherProfile
    }), [
        teacherProfile, isLoadingTeacherProfile, teacherProfileError,
        refreshTeacherProfile, getFullTeacherProfileImageUrl, isTeacherAuthenticated
        // updateTeacherProfilePic is stable if defined outside useMemo
    ]);

    return (
        <TeacherProfileContext.Provider value={value}>
            {children}
        </TeacherProfileContext.Provider>
    );
};
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Make sure you have installed jwt-decode: npm install jwt-decode

const ProtectedRoute = ({ allowedUserType }) => {
  const location = useLocation(); // Get current location for redirection state
  console.log(`--- ProtectedRoute Activated ---`);
  console.log(`Path: ${location.pathname}, Required Type: ${allowedUserType || 'Any authenticated'}`);

  const token = localStorage.getItem('authToken');
  let isAuthenticated = false;
  let user = null;
  let isTokenValid = false;
  let reason = "Initialization"; // For debugging redirection reason

  if (token) {
    console.log("Token found.");
    try {
      const decodedToken = jwtDecode(token);
      // console.log("Decoded Token:", decodedToken); // Debugging sensitive info
      const currentTime = Date.now() / 1000; // Expiration is in seconds

      if (decodedToken.exp > currentTime) {
        // Token is not expired
        isTokenValid = true;
        user = decodedToken; // Contains userId, userType
        console.log(`Token valid. User Type: ${user.userType}`);

        // Check if the user type matches the allowed type for this route
        if (!allowedUserType || user.userType === allowedUserType) {
          isAuthenticated = true;
          reason = "Authenticated and authorized.";
          console.log("Authorization SUCCESS.");
        } else {
          isAuthenticated = false;
          reason = `User type mismatch (User: ${user.userType}, Required: ${allowedUserType})`;
          console.warn(reason);
        }
      } else {
        // Token is expired
        isAuthenticated = false;
        isTokenValid = false;
        reason = "Token expired.";
        console.warn(reason);
        localStorage.removeItem('authToken'); // Clear expired token
      }
    } catch (error) {
      // Token is invalid or decoding failed
      isAuthenticated = false;
      isTokenValid = false;
      reason = "Token decode error.";
      console.error("Error decoding token:", error);
      localStorage.removeItem('authToken'); // Clear invalid token
    }
  } else {
    // No token found
    isAuthenticated = false;
    reason = "No token found.";
    console.warn(reason);
  }

  // --- REDIRECTION LOGIC ---
  if (isAuthenticated) {
    // User is authenticated and authorized for this route
    console.log(`Access GRANTED to ${location.pathname}. Rendering Outlet.`);
    return <Outlet />; // Render the nested child component (e.g., TeacherLayout or StudentLayout)
  } else {
    // User is not authenticated or not authorized
    console.error(`Access DENIED to ${location.pathname}. Reason: ${reason}. Redirecting to /AuthForm.`);
    // Redirect to the login page
    // Pass the current location state so user can be redirected back after login
    return <Navigate to="/AuthForm" state={{ from: location, message: `Access Denied: ${reason}` }} replace />;
  }
};

export default ProtectedRoute;
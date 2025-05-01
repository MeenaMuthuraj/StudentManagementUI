// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom'; // Import useLocation
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ allowedUserType }) => {
  const location = useLocation(); // Get current location
  console.log(`--- ProtectedRoute (${allowedUserType}) ---`);
  console.log(`Checking access for path: ${location.pathname}`);

  const token = localStorage.getItem('authToken');
  let isAuthenticated = false;
  let userType = null;
  let isTokenExpired = true;
  let shouldRedirectReason = "Initialization"; // Track why redirect happens

  if (token) {
    console.log("Token found in localStorage.");
    try {
      const decodedToken = jwtDecode(token);
      userType = decodedToken.userType;
      const currentTime = Date.now() / 1000;

      console.log("Decoded Token:", decodedToken);
      console.log("Current Time:", currentTime, "Token Expires:", decodedToken.exp);

      if (decodedToken.exp && decodedToken.exp > currentTime) {
        console.log("Token is NOT expired.");
        isTokenExpired = false;
        if (allowedUserType && userType === allowedUserType) {
          console.log(`User type '${userType}' matches allowed type '${allowedUserType}'. Authentication SUCCESS.`);
          isAuthenticated = true;
          shouldRedirectReason = "Authenticated";
        } else if (!allowedUserType) {
          console.log("No specific user type required. Authentication SUCCESS.");
          isAuthenticated = true;
          shouldRedirectReason = "Authenticated (No specific type needed)";
        } else {
          console.warn(`User type mismatch. User is '${userType}', required is '${allowedUserType}'.`);
          shouldRedirectReason = "User Type Mismatch";
        }
      } else {
         console.warn("Token IS expired.");
         isTokenExpired = true;
         shouldRedirectReason = "Token Expired";
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      isAuthenticated = false;
      shouldRedirectReason = "Token Decode Error";
      // Optionally remove invalid token
      // localStorage.removeItem('authToken'); // Be cautious with auto-removal here
    }
  } else {
      console.warn("No token found in localStorage.");
      shouldRedirectReason = "No Token";
      isTokenExpired = false; // No token, so not technically expired
  }

  // --- Decision Logic ---
  if (isAuthenticated) {
    console.log(`ProtectedRoute Decision: ALLOW access to ${location.pathname}. Rendering Outlet.`);
    return <Outlet />; // Render the nested child route
  } else {
     // If token exists but expired, clear it
     if (token && isTokenExpired) {
        localStorage.removeItem('authToken');
        console.log("Cleared expired token.");
     }
     
     const redirectPath = "/AuthForm"; // Or your login path
     console.error(`ProtectedRoute Decision: DENY access to ${location.pathname}. Reason: ${shouldRedirectReason}. Redirecting to ${redirectPath}.`);
     // Redirect to login
     return <Navigate to={redirectPath} replace state={{ message: `Access Denied: ${shouldRedirectReason}`, from: location.pathname }} />;
  }
};

export default ProtectedRoute;
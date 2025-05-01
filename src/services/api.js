// src/services/api.js
import axios from 'axios';

// Create axios instance with base URL from environment variables
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  // --- REMOVED default Content-Type header from here ---
  // headers: {
  //   'Content-Type': 'application/json', // <-- REMOVED THIS LINE
  // },
});

// Request interceptor to add auth token and handle Content-Type
api.interceptors.request.use(
  (config) => {
    console.log('API Interceptor: Running request...');
    const token = localStorage.getItem('authToken');
    // console.log('API Interceptor: Token from localStorage:', token); // Optional: less verbose logging

    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.log('API Interceptor: Setting Authorization header.'); // Optional
    } else {
      console.log('API Interceptor: No token found, Authorization header not set.');
    }

    // --- *** IMPORTANT FIX for Content-Type Handling *** ---
    // Check if the data being sent is an instance of FormData
    if (config.data instanceof FormData) {
      // If it's FormData, DELETE any preset Content-Type header.
      // This allows the browser to correctly set the 'multipart/form-data'
      // header with the necessary boundary string.
      delete config.headers['Content-Type'];
      console.log('API Interceptor: Request data is FormData, Content-Type header removed for browser default.');
    } else if (config.method === 'post' || config.method === 'put' || config.method === 'patch') {
      // For other POST, PUT, PATCH requests that are NOT FormData,
      // explicitly set the Content-Type to application/json.
      // This ensures your regular JSON data submissions work correctly.
      // Avoid setting this for GET/DELETE requests as they typically don't have JSON bodies.
      config.headers['Content-Type'] = 'application/json';
      console.log('API Interceptor: Request data is NOT FormData, ensuring Content-Type is application/json.');
    }
    // -----------------------------------------------------

    // Log the final headers being sent (for debugging)
    // console.log('API Interceptor: Final request headers:', config.headers);

    return config; // Return the modified config
  },
  (error) => {
    // Handle errors during request setup
    console.error('API Interceptor Request Setup Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors like 401 Unauthorized
// src/services/api.js - Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response; // Pass through successful responses
  },
  (error) => {
    console.error('API Interceptor Response Error Status:', error.response?.status); // Log status
    console.error('API Interceptor Response Error Data:', error.response?.data);   // Log data

    // Make sure this condition is EXACTLY checking for 401
    if (error.response?.status === 401) { // STRICT check for 401
      console.log('API Interceptor: Unauthorized (401). Clearing token, redirecting...');
      localStorage.removeItem('authToken');
      // Redirecting using window.location.href is okay, make sure target is right
      // Maybe change '/login' to '/AuthForm' if that's your actual path?
       window.location.href = '/AuthForm'; // Or your correct login path
    }
    // For ALL other errors (like 500, 400, 404), just reject the promise
    return Promise.reject(error);
  }
);
// --- Helper Functions (using the configured 'api' instance) ---

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
    // You might also want to set the default header here, but the interceptor handles it per-request
    // api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('authToken');
    // delete api.defaults.headers.common['Authorization'];
  }
};

// Generic GET request helper
export const get = async (url, params = {}) => {
  try {
    const response = await api.get(url, { params });
    return response.data; // Return only the data part of the response
  } catch (error) {
    // Re-throw the error so components can catch it, or process specific errors here
    console.error(`API GET Error (${url}):`, error.response?.data || error.message);
    throw error; // Re-throwing allows component-level catch blocks
  }
};

// Generic POST request helper
export const post = async (url, data = {}) => {
  try {
    // The interceptor handles Content-Type based on 'data' type (JSON or FormData)
    const response = await api.post(url, data);
    return response.data;
  } catch (error) {
    console.error(`API POST Error (${url}):`, error.response?.data || error.message);
    throw error;
  }
};

// Generic PUT request helper
export const put = async (url, data = {}) => {
  try {
    // The interceptor handles Content-Type based on 'data' type
    const response = await api.put(url, data);
    return response.data;
  } catch (error) {
    console.error(`API PUT Error (${url}):`, error.response?.data || error.message);
    throw error;
  }
};

// Generic DELETE request helper
export const del = async (url) => {
  try {
    const response = await api.delete(url);
    return response.data;
  } catch (error) {
    console.error(`API DELETE Error (${url}):`, error.response?.data || error.message);
    throw error;
  }
};

// Note: The custom 'upload' function below is now somewhat redundant because
// the main 'post' function combined with the interceptor handles FormData correctly.
// You can likely remove this 'upload' helper if your `handleImageUpload` uses `api.post` directly.
/*
export const upload = async (url, file, fieldName = 'file') => {
  console.warn("Using deprecated 'upload' helper. Consider using api.post directly.");
  try {
    const formData = new FormData();
    formData.append(fieldName, file);
    // api.post will handle headers correctly via the interceptor
    const response = await api.post(url, formData);
    return response.data;
  } catch (error) {
    console.error(`API Upload Helper Error (${url}):`, error.response?.data || error.message);
    throw error;
  }
};
*/

export default api; // Export the configured Axios instance
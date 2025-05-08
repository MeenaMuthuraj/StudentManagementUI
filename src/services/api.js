import axios from 'axios';

// Create axios instance with base URL from environment variables
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  // Content-Type is handled dynamically by the request interceptor
});

// --- Request Interceptor (Handles Auth Token & Content-Type) ---
// (This part remains unchanged as it looked correct)
api.interceptors.request.use(
  (config) => {
    console.log('API Interceptor: Running request...'); // Debug log
    const token = localStorage.getItem('authToken');

    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('API Interceptor: No token found.'); // Informative log
    }

    // Dynamically set Content-Type based on data type
    if (config.data instanceof FormData) {
      // Let the browser set Content-Type for FormData (important for boundaries)
      delete config.headers['Content-Type'];
      console.log('API Interceptor: Request data is FormData, Content-Type header removed.'); // Debug log
    } else if (config.method === 'post' || config.method === 'put' || config.method === 'patch') {
      // Set Content-Type for typical JSON data
      config.headers['Content-Type'] = 'application/json';
      console.log('API Interceptor: Request data is not FormData, ensuring Content-Type is application/json.'); // Debug log
    }

    return config; // Return the modified config
  },
  (error) => {
    // Handle errors during the request setup phase
    console.error('API Interceptor Request Setup Error:', error);
    return Promise.reject(error);
  }
);

// --- Response Interceptor (Handles Response Errors) ---
// (This is the updated part with enhanced logging)
api.interceptors.response.use(
  (response) => {
    // If the request was successful, just pass the response along
    return response;
  },
  (error) => {
    // --- >>> ENHANCED ERROR LOGGING START <<< ---
    console.error('--- API Response Interceptor Error Encountered ---');

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
      console.error('Error Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser
      // Often indicates a network error, CORS issue (sometimes), or backend not running
      console.error('Error Request:', error.request);
      console.error('Network Error: No response received from the server.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error Message:', error.message);
    }

    // Log the full error object and config for detailed debugging
    console.error('Full Error Object:', error);
    console.error('Request Config:', error.config);
    console.error('-------------------------------------------------');
    // --- >>> ENHANCED ERROR LOGGING END <<< ---

    // --- Specific Error Handling (e.g., 401 Unauthorized) ---
    if (error.response?.status === 401) {
      console.log('API Interceptor: Unauthorized (401). Clearing token and redirecting to login...');
      localStorage.removeItem('authToken');
      // Use window.location for a full redirect, clearing React state
      window.location.href = '/AuthForm'; // Ensure this is your correct login page path
      // Avoid further processing after redirect
      return Promise.reject(new Error("Unauthorized access - Redirecting to login.")); // Reject with a specific message if needed
    }

    // For ALL other errors, reject the promise so component catch blocks can handle them
    return Promise.reject(error);
  }
);

// --- Helper Functions (using the configured 'api' instance) ---
// (These remain unchanged)

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

// Generic GET request helper
export const get = async (url, params = {}) => {
  try {
    const response = await api.get(url, { params });
    return response.data;
  } catch (error) {
    // Enhanced logging happens in the interceptor, just re-throw here
    console.error(`API Helper GET Error (${url}): Handled by interceptor.`);
    throw error;
  }
};

// Generic POST request helper
export const post = async (url, data = {}) => {
  try {
    const response = await api.post(url, data);
    return response.data;
  } catch (error) {
    console.error(`API Helper POST Error (${url}): Handled by interceptor.`);
    throw error;
  }
};

// Generic PUT request helper
export const put = async (url, data = {}) => {
  try {
    const response = await api.put(url, data);
    return response.data;
  } catch (error) {
    console.error(`API Helper PUT Error (${url}): Handled by interceptor.`);
    throw error;
  }
};

// Generic DELETE request helper
export const del = async (url) => {
  try {
    const response = await api.delete(url);
    return response.data;
  } catch (error) {
    console.error(`API Helper DELETE Error (${url}): Handled by interceptor.`);
    throw error;
  }
};

export default api; // Export the configured Axios instance
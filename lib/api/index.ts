import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Export all API modules
export * as auth from './auth';
export * as posts from './posts';
export * as users from './users';
export * as profile from './profile';

const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // For Android Emulator
      if (Platform.constants.Version >= 1000000) {
        return 'http://10.0.2.2:5001/api';
      }
      // For physical Android device or Expo Go
      return 'http://192.168.1.10:5001/api';
    }
    // For iOS
    return 'http://localhost:5001/api';
  }
  return process.env.EXPO_PUBLIC_API_URL + '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Simple request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      console.log('🔄 Preparing request:', {
        url: config.url,
        method: config.method
      });
      
      // List of public endpoints that don't need auth
      const publicEndpoints = [
        '/clerk/login',
        '/clerk/createUser'
      ];
      
      // Skip auth for public endpoints
      const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
      if (isPublicEndpoint) {
        console.log('🌐 Accessing public endpoint - skipping auth');
        return config;
      }
      
      const token = await SecureStore.getItemAsync('auth_token');
      console.log('🔑 Auth token found:', !!token);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Added auth header');
      } else {
        console.log('⚠️ No auth token available');
      }
      return config;
    } catch (error) {
      console.error('❌ Error in request interceptor:', error);
      return config;
    }
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Simple response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('mongo_user_id');
    }
    return Promise.reject(error);
  }
);

// Request logging function
const logRequest = (config: any) => {
  console.log('🚀 API Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    data: config.data,
    headers: config.headers,
  });
};

// Response logging function
const logResponse = (response: any) => {
  console.log('✅ API Response:', {
    status: response.status,
    url: response.config.url,
    data: response.data,
  });
};

// Error logging function
const logError = (error: any) => {
  console.error('❌ API Error:', {
    message: error.message,
    url: error.config?.url,
    baseURL: error.config?.baseURL,
    status: error.response?.status,
    data: error.response?.data,
  });
};

// Update response interceptor
api.interceptors.response.use(
  (response) => {
    logResponse(response);
    return response;
  },
  async (error) => {
    logError(error);
    
    // Don't throw on 500 for user creation
    if (error.config?.url?.includes('/clerk/createUser') && error.response?.status === 500) {
      console.log('⚠️ User creation failed, but continuing...');
      return { data: { user: null, token: null } };
    }
    
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('mongo_user_id');
      console.log('�� User token cleared due to unauthorized access');
    }
    
    return Promise.reject(error);
  }
);

// Log the current base URL on initialization
console.log('🌐 API Base URL:', getBaseUrl());

export default api; 
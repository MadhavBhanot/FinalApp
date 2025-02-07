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
      return 'http://10.0.2.2:5001/api';
    }
    // For iOS simulator or web
    return 'http://localhost:5001/api';
  }
  // For production
  return process.env.EXPO_PUBLIC_API_URL + '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000 // 10 second timeout
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      console.log('🔄 Preparing request:', {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL
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
      console.log('🔑 Auth token found:', token ? 'yes' : 'no');
      
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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      // Clear stored credentials on authentication failure
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('mongo_user_id');
      console.log('🔒 Cleared stored credentials due to auth error');
    }
    
    return Promise.reject(error);
  }
);

// Log the current base URL on initialization
console.log('🌐 API Base URL:', getBaseUrl());

export default api; 
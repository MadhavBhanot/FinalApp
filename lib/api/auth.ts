import api from './index';
import * as SecureStore from 'expo-secure-store';
import { Profile } from './profile';

export interface UserData {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  clerkId: string;
  username?: string;
  bio?: string;
  followers?: string[];
  following?: string[];
  posts?: string[];
  savedPosts?: string[];
}

export interface LoginResponse {
  status: string;
  message: string;
  data: {
    user: UserData;
    token: string;
  }
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Store auth token
const storeToken = async (token: string) => {
  try {
    await SecureStore.setItemAsync('auth_token', token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

// Store MongoDB user ID
const storeMongoUserId = async (userId: string) => {
  try {
    await SecureStore.setItemAsync('mongo_user_id', userId);
  } catch (error) {
    console.error('Error storing MongoDB User ID:', error);
  }
};

// Get stored MongoDB user ID
export const getMongoUserId = async (): Promise<string | null> => {
  try {
    const userId = await SecureStore.getItemAsync('mongo_user_id');
    console.log('👤 Retrieved MongoDB User ID:', userId);
    return userId;
  } catch (error) {
    console.error('❌ Error getting MongoDB User ID:', error);
    return null;
  }
};

// Initialize backend session after Clerk authentication
export const initializeBackendSession = async (user: any) => {
  try {
    console.log('🔄 Initializing backend session for user:', {
      clerkId: user?.id,
      email: user?.emailAddresses[0]?.emailAddress
    });
    
    if (!user?.id) {
      console.error('❌ No Clerk user ID provided');
      return null;
    }

    // Try to login/create user in our backend
    const loginResponse = await api.post('/clerk/login', {
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl
    });

    console.log('📥 Login/Register response:', loginResponse.data);

    if (loginResponse.data?.data?.token && loginResponse.data?.data?.user?._id) {
      console.log('💾 Storing credentials');
      await SecureStore.setItemAsync('auth_token', loginResponse.data.data.token);
      await SecureStore.setItemAsync('mongo_user_id', loginResponse.data.data.user._id);
      console.log('✅ Stored MongoDB user ID:', loginResponse.data.data.user._id);
      
      return {
        success: true,
        data: {
          user: loginResponse.data.data.user,
          token: loginResponse.data.data.token
        }
      };
    } else {
      console.error('❌ Invalid login response format:', loginResponse.data);
      return {
        success: false,
        error: 'Invalid login response format'
      };
    }
  } catch (error: any) {
    console.error('❌ Error in session initialization:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    // Clear any potentially invalid tokens
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('mongo_user_id');
    return {
      success: false,
      error: error.message
    };
  }
};

// Get current user's MongoDB ID with better error handling
export const getCurrentMongoUserId = async (): Promise<string | null> => {
  try {
    const mongoUserId = await SecureStore.getItemAsync('mongo_user_id');
    if (!mongoUserId) {
      console.log('⚠️ No MongoDB user ID found in storage');
      return null;
    }
    console.log('✅ Retrieved MongoDB user ID:', mongoUserId);
    return mongoUserId;
  } catch (error) {
    console.error('❌ Error getting MongoDB user ID:', error);
    return null;
  }
};

// Get current user profile
export const getCurrentUser = async (): Promise<UserData | null> => {
  try {
    const userId = await SecureStore.getItemAsync('mongo_user_id');
    if (!userId) return null;

    const response = await api.get(`/users/${userId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Logout
export const logout = async () => {
  try {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('mongo_user_id');
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

// Check authentication status with enhanced logging
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await getStoredToken();
    if (!token) {
      console.log('🔒 No token found, user is not authenticated');
      return false;
    }
    
    console.log('🔄 Verifying token with backend...');
    const response = await api.get('/auth/verify');
    console.log('✅ Token verification response:', response.data);
    return response.data.success;
  } catch (error: any) {
    console.error('❌ Auth check error:', error.response?.data || error.message);
    return false;
  }
};

// Get stored token with logging
export const getStoredToken = async () => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      console.log('📱 Retrieved stored token:', {
        exists: true,
        length: token.length,
        prefix: token.substring(0, 20) + '...',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('📱 No token found in storage');
    }
    return token;
  } catch (error) {
    console.error('❌ Error getting token:', error);
    return null;
  }
};

export const createClerkUser = async (userData: UserData) => {
  const response = await api.post('/clerk/createUser', userData);
  return response.data;
};

export const updateClerkUser = async (userId: string, userData: Partial<UserData>) => {
  const response = await api.post(`/clerk/updateUser/${userId}`, userData);
  return response.data;
};

export const deleteClerkUser = async (userId: string) => {
  const response = await api.delete(`/clerk/deleteUser/${userId}`);
  return response.data;
}; 
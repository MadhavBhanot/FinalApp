import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

// Types
interface SignUpParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

interface SignInParams {
  email: string;
  password: string;
}

interface CreatePostParams {
  imageUri: string;
  caption: string;
  tags: string[];
  filters?: string;
  location?: string;
}

interface VerifyEmailParams {
  email: string;
  code: string;
}

interface SignInResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    isVerified: boolean;
  };
  token?: string;
}

// Auth API
class Auth {
  private async getHeaders() {
    const token = await SecureStore.getItemAsync('token');
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  private async handleResponse(response: any) {
    if (response.data.token) {
      await this.storeToken(response.data.token);
    }
    return response.data;
  }

  private async handleError(error: any) {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await this.removeToken();
    }
    throw error;
  }

  async signUp(params: SignUpParams) {
    try {
      const response = await axios.post(`${BASE_URL}/api/clerk/createUser`, params);
      return response.data;
    } catch (error: any) {
      console.error('Sign up error:', error.response?.data || error.message);
      throw error;
    }
  }

  async signIn(params: SignInParams): Promise<SignInResponse> {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, params);
      return this.handleResponse(response);
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async signOut() {
    try {
      await this.removeToken();
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async storeToken(token: string) {
    try {
      await SecureStore.setItemAsync('token', token);
    } catch (error) {
      console.error('Error storing token:', error);
      throw error;
    }
  }

  async getToken() {
    try {
      return await SecureStore.getItemAsync('token');
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  }

  async removeToken() {
    try {
      await SecureStore.deleteItemAsync('token');
    } catch (error) {
      console.error('Error removing token:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('No token found');
      }
      const response = await axios.get(`${BASE_URL}/api/profile`, {
        headers: await this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async googleAuth(code: string) {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/google`, { code });
      if (response.data.token) {
        await this.storeToken(response.data.token);
      }
      return response.data;
    } catch (error: any) {
      console.error('Google auth error:', error.response?.data || error.message);
      throw error;
    }
  }

  async githubAuth(code: string) {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/github`, { code });
      if (response.data.token) {
        await this.storeToken(response.data.token);
      }
      return response.data;
    } catch (error: any) {
      console.error('GitHub auth error:', error.response?.data || error.message);
      throw error;
    }
  }

  async verifyEmail(params: VerifyEmailParams) {
    try {
      const response = await axios.post(`${BASE_URL}/api/clerk/verifyEmail`, params);
      return this.handleResponse(response);
    } catch (error: any) {
      return this.handleError(error);
    }
  }
}

// Posts API
class Posts {
  private async getHeaders() {
    const token = await auth.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  async create(params: CreatePostParams) {
    try {
      const response = await axios.post(`${BASE_URL}/api/posts`, params, {
        headers: await this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Create post error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getAllPosts() {
    try {
      const response = await axios.get(`${BASE_URL}/api/posts`, {
        headers: await this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Get posts error:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const auth = new Auth();
export const posts = new Posts();
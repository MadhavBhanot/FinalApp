import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { auth } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    checkAuth();
  }, []);

  // Navigation effect
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    console.log('Navigation check:', { isAuthenticated, inAuthGroup, segments });
    
    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/');
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/signin');
    }
  }, [isAuthenticated, isLoading, segments]); // Added segments to dependencies

  const checkAuth = async () => {
    try {
      const token = await auth.getToken();
      setIsAuthenticated(!!token);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await auth.signIn({ email, password });
      if (response.success) {
        setIsAuthenticated(true);
        router.replace('/(tabs)/'); // Force navigation after successful sign in
      }
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setIsAuthenticated(false);
      router.replace('/(auth)/signin'); // Force navigation after sign out
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 
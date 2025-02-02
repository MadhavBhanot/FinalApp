import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { getCurrentUser, initializeBackendSession } from '../lib/api/auth';
import { Profile } from '../lib/api/profile';

export const useCurrentUser = () => {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!clerkLoaded) return;

        if (!isSignedIn || !clerkUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Initialize backend session with Clerk user
        await initializeBackendSession(clerkUser);

        // Get user profile from our backend
        const userProfile = await getCurrentUser();
        console.log('🔄 Current user profile loaded:', userProfile);
        
        setUser(userProfile);
      } catch (err: any) {
        console.error('❌ Error loading user:', err);
        setError(err.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [clerkUser, clerkLoaded, isSignedIn]);

  const refreshUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const userProfile = await getCurrentUser();
      console.log('🔄 User profile refreshed:', userProfile);
      setUser(userProfile);
    } catch (err: any) {
      console.error('❌ Error refreshing user:', err);
      setError(err.message || 'Failed to refresh user');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    refreshUser,
  };
}; 
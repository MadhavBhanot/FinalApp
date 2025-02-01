import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { auth } from '@/lib/api';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await auth.getToken();
      if (!token) {
        router.replace('/(auth)/signin');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/(auth)/signin');
    }
  };

  return <>{children}</>;
} 
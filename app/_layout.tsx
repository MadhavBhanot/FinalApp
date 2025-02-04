import { Stack } from 'expo-router';
import { ClerkProvider } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PostsProvider } from '@/contexts/posts';
import { ActivityStatusProvider } from '@/contexts/ActivityStatus';
import { PortalProvider } from '@gorhom/portal';

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn) {
      // If user is signed in, redirect to home
      if (segments.length === 0 || inAuthGroup) {
        router.replace('/(tabs)/home');
      }
    } else {
      // If user is not signed in
      if (inTabsGroup) {
        // Redirect to sign in if trying to access protected screens
        router.replace('/(auth)/signin');
      } else if (segments.length === 0) {
        // Show terms page for new sessions
        router.replace('/');  // This will show the index page with terms
      }
    }
  }, [isSignedIn, segments, isLoaded]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PortalProvider>
        <ClerkProvider
          publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
          tokenCache={tokenCache}
        >
          <ActivityStatusProvider>
            <PostsProvider>
              <InitialLayout />
            </PostsProvider>
          </ActivityStatusProvider>
        </ClerkProvider>
      </PortalProvider>
    </GestureHandlerRootView>
  );
}
import { Stack } from 'expo-router';
import { ClerkProvider } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PostsProvider } from '@/contexts/posts';
import { ActivityStatusProvider } from '@/contexts/ActivityStatus';
import { AuthProvider } from '@/contexts/AuthContext';

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

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ActivityStatusProvider>
            <PostsProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </PostsProvider>
          </ActivityStatusProvider>
        </GestureHandlerRootView>
      </AuthProvider>
    </ClerkProvider>
  );
}
import { Stack } from 'expo-router'

export default function CreatePostLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="select-media" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="edit-media" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="add-details" 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
} 
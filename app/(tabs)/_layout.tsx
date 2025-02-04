import { Tabs } from 'expo-router';
import { Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BlurTabBarBackground from '@/components/ui/TabBarBackground.ios';
import { useUser } from '@clerk/clerk-expo';
import { HomeIcon } from '@/components/icons/HomeIcon';
import { MessageIcon } from '@/components/icons/MessageIcon';
import { ReelsIcon } from '@/components/icons/ReelsIcon';

export default function TabLayout() {
  const { user } = useUser();

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#222',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarShowLabel: false,
        tabBarBackground: Platform.OS === 'ios' ? () => <BlurTabBarBackground /> : undefined,
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          tabBarIcon: ({ color, size }) => (
            <ReelsIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, size }) => (
            user?.imageUrl ? (
              <Image 
                source={{ uri: user.imageUrl }} 
                style={{
                  width: size,
                  height: size,
                  borderRadius: size/2,
                  borderWidth: 2,
                  borderColor: focused ? '#fff' : 'transparent'
                }}
              />
            ) : (
              <Ionicons 
                name="person-circle-outline" 
                size={size + 2} 
                color={focused ? '#fff' : '#666'} 
              />
            )
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
} 
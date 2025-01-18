import React, { useEffect, useRef, useState } from 'react';
import { Modal, Text, View, StyleSheet, Animated, Dimensions, TouchableOpacity, Platform, Image } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { EditProfileModal } from './EditProfile';
import { SettingsModal } from './SettingsModal';
import { useActivityStatus } from '../contexts/ActivityStatusContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export function HamburgerMenu({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
  const { signOut } = useAuth();
  const { user } = useUser();
  const theme = useColorScheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { isActive } = useActivityStatus();

  useEffect(() => {
    if (isVisible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        mass: 0.8,
        stiffness: 100,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        damping: 25,
        mass: 0.8,
        stiffness: 100,
      }).start();
    }
  }, [isVisible]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    {
      icon: "person-circle-outline",
      label: "Edit Profile",
      color: "#6C63FF",
      bgColor: "rgba(108, 99, 255, 0.15)",
      onPress: () => {
        setShowEditProfile(true);
      }
    },
    {
      icon: "settings-outline",
      label: "Settings",
      color: "#00BCD4",
      bgColor: "rgba(0, 188, 212, 0.15)",
      onPress: () => {
        setShowSettings(true);
      }
    },
    {
      icon: "log-out-outline",
      label: "Sign Out",
      color: "#FF4545",
      bgColor: "rgba(255, 69, 69, 0.15)",
      onPress: handleSignOut
    }
  ];

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <LinearGradient
        colors={['rgba(108, 99, 255, 0.2)', 'transparent']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.profileInfo}>
        <View style={styles.avatarContainer}>
          {user?.imageUrl ? (
            <View>
              <Image
                source={{ uri: user.imageUrl }}
                style={styles.avatar}
              />
              {isActive && <View style={styles.statusDot} />}
            </View>
          ) : (
            <View>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.[0] || user?.username?.[0] || '?'}
                </Text>
              </View>
              {isActive && <View style={styles.statusDot} />}
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username || 'User'}
          </Text>
          <Text style={styles.userEmail}>
            {user?.emailAddresses[0]?.emailAddress || 'No email'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
            }
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint={theme} style={styles.blurContainer}>
              <View style={styles.content}>
                <View style={styles.handle} />
                {renderProfileHeader()}
                {menuItems.map((item, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={[styles.menuItem, index === menuItems.length - 1 && styles.lastMenuItem]}
                    onPress={item.onPress}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
                      <Ionicons name={item.icon as any} size={24} color={item.color} />
                    </View>
                    <Text style={[styles.menuText, { color: item.color }]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </BlurView>
          ) : (
            <View style={[styles.content, { backgroundColor: Colors[theme].background }]}>
              <View style={styles.handle} />
              {renderProfileHeader()}
              {menuItems.map((item, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[styles.menuItem, index === menuItems.length - 1 && styles.lastMenuItem]}
                  onPress={item.onPress}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
                    <Ionicons name={item.icon as any} size={24} color={item.color} />
                  </View>
                  <Text style={[styles.menuText, { color: item.color }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>
      </View>
      <EditProfileModal 
        isVisible={showEditProfile}
        onClose={() => {
          setShowEditProfile(false);
          onClose();
        }}
      />
      <SettingsModal 
        isVisible={showSettings}
        onClose={() => {
          setShowSettings(false);
          onClose();
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    width: SCREEN_WIDTH,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -3,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  blurContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  profileHeader: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#000',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
}); 
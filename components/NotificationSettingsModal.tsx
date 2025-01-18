import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Switch,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NotificationSettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function NotificationSettingsModal({ isVisible, onClose }: NotificationSettingsModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [notificationSettings, setNotificationSettings] = React.useState({
    posts: true,
    stories: true,
    comments: true,
    mentions: true,
    directMessages: true,
    newFollowers: true,
    emailNotifications: false,
    soundEnabled: true,
    vibrationEnabled: true
  });

  useEffect(() => {
    if (isVisible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        mass: 0.6,
        stiffness: 250,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        damping: 20,
        mass: 0.6,
        stiffness: 250,
      }).start();
    }
  }, [isVisible]);

  const notificationOptions = [
    {
      id: 'interactions',
      title: 'Interaction Notifications',
      items: [
        {
          id: 'posts',
          label: 'Posts & Reels',
          description: 'Likes, comments and shares on your posts',
          icon: 'images-outline',
          color: '#2196F3',
          value: notificationSettings.posts,
          onValueChange: (value: boolean) => 
            setNotificationSettings(prev => ({ ...prev, posts: value }))
        },
        {
          id: 'comments',
          label: 'Comments',
          description: 'When someone comments on your posts',
          icon: 'chatbubble-outline',
          color: '#4CAF50',
          value: notificationSettings.comments,
          onValueChange: (value: boolean) => 
            setNotificationSettings(prev => ({ ...prev, comments: value }))
        },
        {
          id: 'mentions',
          label: 'Mentions',
          description: 'When someone mentions you',
          icon: 'at-outline',
          color: '#FF9800',
          value: notificationSettings.mentions,
          onValueChange: (value: boolean) => 
            setNotificationSettings(prev => ({ ...prev, mentions: value }))
        }
      ]
    },
    {
      id: 'messages',
      title: 'Messages & Followers',
      items: [
        {
          id: 'directMessages',
          label: 'Direct Messages',
          description: 'When you receive new messages',
          icon: 'mail-outline',
          color: '#9C27B0',
          value: notificationSettings.directMessages,
          onValueChange: (value: boolean) => 
            setNotificationSettings(prev => ({ ...prev, directMessages: value }))
        },
        {
          id: 'newFollowers',
          label: 'New Followers',
          description: 'When someone follows you',
          icon: 'person-add-outline',
          color: '#E91E63',
          value: notificationSettings.newFollowers,
          onValueChange: (value: boolean) => 
            setNotificationSettings(prev => ({ ...prev, newFollowers: value }))
        }
      ]
    },
    {
      id: 'preferences',
      title: 'Notification Preferences',
      items: [
        {
          id: 'emailNotifications',
          label: 'Email Notifications',
          description: 'Receive notifications via email',
          icon: 'mail-outline',
          color: '#607D8B',
          value: notificationSettings.emailNotifications,
          onValueChange: (value: boolean) => 
            setNotificationSettings(prev => ({ ...prev, emailNotifications: value }))
        },
        {
          id: 'soundEnabled',
          label: 'Sound',
          description: 'Play sound for notifications',
          icon: 'volume-high-outline',
          color: '#00BCD4',
          value: notificationSettings.soundEnabled,
          onValueChange: (value: boolean) => 
            setNotificationSettings(prev => ({ ...prev, soundEnabled: value }))
        },
        {
          id: 'vibrationEnabled',
          label: 'Vibration',
          description: 'Vibrate for notifications',
          icon: 'phone-portrait-outline',
          color: '#FF5722',
          value: notificationSettings.vibrationEnabled,
          onValueChange: (value: boolean) => 
            setNotificationSettings(prev => ({ ...prev, vibrationEnabled: value }))
        }
      ]
    }
  ];

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
          <View style={styles.header}>
            <Text style={styles.title}>Notification Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {notificationOptions.map((section) => (
              <View key={section.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.items.map((item) => (
                  <View key={item.id} style={styles.settingItem}>
                    <View style={styles.settingIcon}>
                      <LinearGradient
                        colors={[`${item.color}20`, `${item.color}10`]}
                        style={styles.iconGradient}
                      >
                        <Ionicons name={item.icon as any} size={24} color={item.color} />
                      </LinearGradient>
                    </View>
                    <View style={styles.settingContent}>
                      <Text style={styles.settingTitle}>{item.label}</Text>
                      <Text style={styles.settingDescription}>{item.description}</Text>
                    </View>
                    <Switch
                      value={item.value}
                      onValueChange={item.onValueChange}
                      trackColor={{ false: '#767577', true: `${item.color}50` }}
                      thumbColor={item.value ? item.color : '#f4f3f4'}
                    />
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
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
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '50%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    position: 'relative',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#222',
    borderRadius: 12,
  },
  settingIcon: {
    marginRight: 16,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
  },
}); 
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ContentVisibilityModal } from './ContentVisibilityModal';
import { ProfileVisibilityModal } from './ProfileVisibilityModal';
import { DirectMessageSettingsModal } from './DirectMessageSettingsModal';
import { useActivityStatus } from '@/contexts/ActivityStatus';

interface PrivacySettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function PrivacySettingsModal({ isVisible, onClose }: PrivacySettingsModalProps) {
  const { isActive, setIsActive } = useActivityStatus();
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    contentVisibility: {
      posts: 'public',
      stories: 'public',
      reels: 'public'
    },
    directMessages: 'everyone',
    blockedUsers: [] as string[],
    limitedUsers: [] as string[],
    hiddenUsers: [] as string[]
  });

  const [showProfileVisibility, setShowProfileVisibility] = useState(false);
  const [showDirectMessageSettings, setShowDirectMessageSettings] = useState(false);
  const [selectedContent, setSelectedContent] = useState<'Posts' | 'Stories' | 'Reels' | null>(null);

  const privacyOptions = [
    {
      id: 'account',
      title: 'Account Privacy',
      items: [
        {
          id: 'profile',
          label: 'Profile Visibility',
          description: 'Control who can see your profile',
          icon: 'person',
          color: '#2196F3',
          value: privacySettings.profileVisibility,
          onPress: () => setShowProfileVisibility(true)
        },
        {
          id: 'activity',
          label: 'Activity Status',
          description: 'Show when you\'re active',
          icon: 'radio',
          color: '#4CAF50',
          type: 'switch',
          value: isActive,
          onValueChange: setIsActive
        }
      ]
    },
    {
      id: 'content',
      title: 'Content Privacy',
      items: [
        {
          id: 'posts',
          label: 'Posts',
          description: 'Who can see your posts',
          icon: 'images',
          color: '#FF9800',
          value: privacySettings.contentVisibility.posts,
          onPress: () => setSelectedContent('Posts')
        },
        {
          id: 'stories',
          label: 'Stories',
          description: 'Who can see your stories',
          icon: 'film',
          color: '#E91E63',
          value: privacySettings.contentVisibility.stories,
          onPress: () => setSelectedContent('Stories')
        },
        {
          id: 'reels',
          label: 'Reels',
          description: 'Who can see your reels',
          icon: 'videocam',
          color: '#9C27B0',
          value: privacySettings.contentVisibility.reels,
          onPress: () => setSelectedContent('Reels')
        }
      ]
    },
    {
      id: 'interactions',
      title: 'Interactions',
      items: [
        {
          id: 'messages',
          label: 'Message Privacy',
          description: 'Control who can message you',
          icon: 'mail',
          color: '#00BCD4',
          value: privacySettings.directMessages,
          onPress: () => setShowDirectMessageSettings(true)
        }
      ]
    }
  ];

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Privacy Settings</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {privacyOptions.map((section) => (
            <View key={section.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.settingItem}
                  onPress={item.onPress}
                >
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
                  {item.type === 'switch' ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onValueChange}
                      trackColor={{ false: '#767577', true: `${item.color}50` }}
                      thumbColor={item.value ? item.color : '#f4f3f4'}
                    />
                  ) : (
                    <View style={styles.settingValue}>
                      <Text style={[styles.valueText, { color: item.color }]}>
                        {item.value.charAt(0).toUpperCase() + item.value.slice(1)}
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color="#666" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>

      <ProfileVisibilityModal
        isVisible={showProfileVisibility}
        onClose={() => setShowProfileVisibility(false)}
        currentValue={privacySettings.profileVisibility}
        onValueChange={(value) => {
          setPrivacySettings(prev => ({
            ...prev,
            profileVisibility: value
          }));
        }}
      />

      {selectedContent && (
        <ContentVisibilityModal
          isVisible={!!selectedContent}
          onClose={() => setSelectedContent(null)}
          contentType={selectedContent}
          currentValue={privacySettings.contentVisibility[selectedContent.toLowerCase() as keyof typeof privacySettings.contentVisibility]}
          onValueChange={(value) => {
            setPrivacySettings(prev => ({
              ...prev,
              contentVisibility: {
                ...prev.contentVisibility,
                [selectedContent.toLowerCase()]: value
              }
            }));
          }}
        />
      )}

      <DirectMessageSettingsModal
        isVisible={showDirectMessageSettings}
        onClose={() => setShowDirectMessageSettings(false)}
        currentValue={privacySettings.directMessages}
        onValueChange={(value) => {
          setPrivacySettings(prev => ({
            ...prev,
            directMessages: value
          }));
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
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
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueText: {
    fontSize: 14,
    color: '#666',
  },
}); 
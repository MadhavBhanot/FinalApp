import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContentVisibilityModal } from './ContentVisibilityModal';
import { ProfileVisibilityModal } from './ProfileVisibilityModal';
import { DirectMessageSettingsModal } from './DirectMessageSettingsModal';
import { useActivityStatus } from '../contexts/ActivityStatusContext';

interface PrivacySettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

// Helper function to format the visibility value
const formatVisibilityValue = (value: string) => {
  // Remove any underscores and format
  const cleanValue = value.replace('_', '');
  if (cleanValue === 'closefriends') return 'Close Friends';
  return cleanValue.charAt(0).toUpperCase() + cleanValue.slice(1);
};

// Add helper function to get icon name based on visibility value
const getVisibilityIcon = (value: string) => {
  switch (value) {
    case 'public':
      return 'globe-outline';
    case 'private':
      return 'lock-closed-outline';
    case 'closefriends':
    case 'close_friends':
      return 'star-outline';
    default:
      return 'globe-outline';
  }
};

// Add a helper function to get color based on visibility value
const getVisibilityColor = (value: string) => {
  switch (value) {
    case 'public':
      return '#2196F3'; // Blue
    case 'private':
      return '#FF5252'; // Red
    case 'closefriends':
    case 'close_friends':
      return '#4CAF50'; // Green
    default:
      return '#666';
  }
};

// Add helper function to get background color based on visibility value
const getVisibilityBgColor = (value: string) => {
  switch (value) {
    case 'public':
      return 'rgba(33, 150, 243, 0.1)'; // Light blue background
    case 'private':
      return 'rgba(255, 82, 82, 0.1)'; // Light red background
    case 'closefriends':
    case 'close_friends':
      return 'rgba(76, 175, 80, 0.1)'; // Light green background
    default:
      return 'transparent';
  }
};

// Add to the helper functions
const getDirectMessageIcon = (value: string) => {
  switch (value) {
    case 'everyone':
      return 'globe-outline';
    case 'followers':
      return 'people-outline';
    case 'following':
      return 'person-add-outline';
    default:
      return 'globe-outline';
  }
};

const getDirectMessageColor = (value: string) => {
  switch (value) {
    case 'everyone':
      return '#2196F3'; // Blue
    case 'followers':
      return '#4CAF50'; // Green
    case 'following':
      return '#FFC107'; // Yellow/Gold
    default:
      return '#666';
  }
};

const getDirectMessageBgColor = (value: string) => {
  switch (value) {
    case 'everyone':
      return 'rgba(33, 150, 243, 0.1)'; // Light blue
    case 'followers':
      return 'rgba(76, 175, 80, 0.1)'; // Light green
    case 'following':
      return 'rgba(255, 193, 7, 0.1)'; // Light yellow
    default:
      return 'transparent';
  }
};

export function PrivacySettingsModal({ isVisible, onClose }: PrivacySettingsModalProps) {
  const { isActive, setIsActive } = useActivityStatus();
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    contentVisibility: {
      posts: 'public',
      stories: 'public',
      reels: 'public'
    },
    followRequests: 'everyone',
    directMessages: 'everyone',
    showOnlineStatus: true,
    blockedUsers: [],
    limitedUsers: [],
    hiddenUsers: []
  });

  const [selectedContent, setSelectedContent] = useState<'Posts' | 'Stories' | 'Reels' | null>(null);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showLimitedUsers, setShowLimitedUsers] = useState(false);
  const [showHiddenUsers, setShowHiddenUsers] = useState(false);
  const [showProfileVisibility, setShowProfileVisibility] = useState(false);
  const [showDirectMessageSettings, setShowDirectMessageSettings] = useState(false);
  const [showActivityVisibilityModal, setShowActivityVisibilityModal] = useState(false);

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
          {/* Profile Visibility */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Visibility</Text>
            <TouchableOpacity 
              style={[
                styles.settingItem,
                { backgroundColor: getVisibilityBgColor(privacySettings.profileVisibility) }
              ]}
              onPress={() => setShowProfileVisibility(true)}
            >
              <View>
                <Text style={styles.settingLabel}>Who can see your profile</Text>
                <Text style={styles.settingDescription}>
                  {privacySettings.profileVisibility === 'public' 
                    ? 'Anyone can view your profile'
                    : 'Only approved followers can see your content'}
                </Text>
              </View>
              <View style={styles.settingValue}>
                <Ionicons 
                  name={getVisibilityIcon(privacySettings.profileVisibility)} 
                  size={20} 
                  color={getVisibilityColor(privacySettings.profileVisibility)} 
                  style={styles.valueIcon}
                />
                <Text style={[
                  styles.valueText,
                  { color: getVisibilityColor(privacySettings.profileVisibility) }
                ]}>
                  {formatVisibilityValue(privacySettings.profileVisibility)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Content Visibility */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content Visibility</Text>
            {['Posts', 'Stories', 'Reels'].map((content) => (
              <TouchableOpacity 
                key={content}
                style={[
                  styles.settingItem,
                  { backgroundColor: getVisibilityBgColor(
                    privacySettings.contentVisibility[content.toLowerCase() as keyof typeof privacySettings.contentVisibility]
                  ) }
                ]}
                onPress={() => setSelectedContent(content as 'Posts' | 'Stories' | 'Reels')}
              >
                <View>
                  <Text style={styles.settingLabel}>Who can see your {content}</Text>
                  <Text style={styles.settingDescription}>
                    {privacySettings.contentVisibility[content.toLowerCase() as keyof typeof privacySettings.contentVisibility] === 'public'
                      ? 'Anyone can view'
                      : privacySettings.contentVisibility[content.toLowerCase() as keyof typeof privacySettings.contentVisibility] === 'private'
                      ? 'Only approved followers can view'
                      : 'Only close friends can view'}
                  </Text>
                </View>
                <View style={styles.settingValue}>
                  <Ionicons 
                    name={getVisibilityIcon(
                      privacySettings.contentVisibility[content.toLowerCase() as keyof typeof privacySettings.contentVisibility]
                    )} 
                    size={20} 
                    color={getVisibilityColor(
                      privacySettings.contentVisibility[content.toLowerCase() as keyof typeof privacySettings.contentVisibility]
                    )} 
                    style={styles.valueIcon}
                  />
                  <Text style={[
                    styles.valueText,
                    { color: getVisibilityColor(
                      privacySettings.contentVisibility[content.toLowerCase() as keyof typeof privacySettings.contentVisibility]
                    ) }
                  ]}>
                    {formatVisibilityValue(
                      privacySettings.contentVisibility[content.toLowerCase() as keyof typeof privacySettings.contentVisibility]
                    )}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Interactions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interactions</Text>
            <TouchableOpacity style={styles.settingItem}>
              <View>
                <Text style={styles.settingLabel}>Follow Requests</Text>
                <Text style={styles.settingDescription}>Control who can follow you</Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.valueText}>{privacySettings.followRequests}</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.settingItem,
                { backgroundColor: getDirectMessageBgColor(privacySettings.directMessages) }
              ]}
              onPress={() => setShowDirectMessageSettings(true)}
            >
              <View>
                <Text style={styles.settingLabel}>Direct Messages</Text>
                <Text style={styles.settingDescription}>
                  {privacySettings.directMessages === 'everyone'
                    ? 'Anyone can send you messages'
                    : privacySettings.directMessages === 'followers'
                    ? 'Only your followers can message you'
                    : 'Only people you follow back can message you'}
                </Text>
              </View>
              <View style={styles.settingValue}>
                <Ionicons 
                  name={getDirectMessageIcon(privacySettings.directMessages)} 
                  size={20} 
                  color={getDirectMessageColor(privacySettings.directMessages)} 
                  style={styles.valueIcon}
                />
                <Text style={[
                  styles.valueText,
                  { color: getDirectMessageColor(privacySettings.directMessages) }
                ]}>
                  {privacySettings.directMessages === 'following' ? 'People You Follow' : 
                    privacySettings.directMessages.charAt(0).toUpperCase() + 
                    privacySettings.directMessages.slice(1)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Activity Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Status</Text>
            <View style={styles.settingItem}>
              <View>
                <Text style={styles.settingLabel}>Show when you're online</Text>
                <Text style={styles.settingDescription}>
                  Let others see when you are active
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isActive ? '#2196F3' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* User Controls */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Controls</Text>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowBlockedUsers(true)}
            >
              <View>
                <Text style={styles.settingLabel}>Blocked Users</Text>
                <Text style={styles.settingDescription}>
                  Users who can't interact with you at all
                </Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.valueText}>{privacySettings.blockedUsers.length}</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowLimitedUsers(true)}
            >
              <View>
                <Text style={styles.settingLabel}>Limited Access</Text>
                <Text style={styles.settingDescription}>
                  Users who can view but not interact
                </Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.valueText}>{privacySettings.limitedUsers.length}</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowHiddenUsers(true)}
            >
              <View>
                <Text style={styles.settingLabel}>Hidden Users</Text>
                <Text style={styles.settingDescription}>
                  Hide their content without unfollowing
                </Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.valueText}>{privacySettings.hiddenUsers.length}</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          </View>
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
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedOption: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  optionText: {
    color: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    borderRadius: 8,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueIcon: {
    marginRight: 4,
  },
  valueText: {
    fontSize: 14,
    color: '#666',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
}); 
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function SettingsModal({ isVisible, onClose }: SettingsModalProps) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              const userEmail = user?.emailAddresses[0]?.emailAddress;
              const userId = user?.id;
              
              await user?.delete();
              await signOut();
              
              console.log('Account deleted successfully:', {
                userId,
                email: userEmail,
                timestamp: new Date().toISOString(),
                status: 'success'
              });
              
              router.replace('/(auth)/signin');
            } catch (error: any) {
              console.error('Delete account error:', {
                userId: user?.id,
                email: user?.emailAddresses[0]?.emailAddress,
                error: error.message,
                timestamp: new Date().toISOString(),
                status: 'failed'
              });
              
              Alert.alert(
                'Error',
                error.message || 'Failed to delete account. Please try again.'
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const settingsOptions = [
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      color: '#4CAF50',
      bgColor: 'rgba(76, 175, 80, 0.15)',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon!')
    },
    {
      icon: 'lock-closed-outline',
      label: 'Privacy',
      color: '#2196F3',
      bgColor: 'rgba(33, 150, 243, 0.15)',
      onPress: () => Alert.alert('Coming Soon', 'Privacy settings will be available soon!')
    },
    {
      icon: 'shield-outline',
      label: 'Security',
      color: '#FFC107',
      bgColor: 'rgba(255, 193, 7, 0.15)',
      onPress: () => Alert.alert('Coming Soon', 'Security settings will be available soon!')
    },
    {
      icon: 'trash-outline',
      label: 'Delete Account',
      color: '#FF5252',
      bgColor: 'rgba(255, 82, 82, 0.15)',
      onPress: handleDeleteAccount
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
          <Text style={styles.title}>Settings</Text>
          <View style={styles.placeholder} />
        </View>

        {isDeleting ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.loadingText}>Deleting account...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            {settingsOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.option}
                onPress={option.onPress}
              >
                <View style={[styles.iconContainer, { backgroundColor: option.bgColor }]}>
                  <Ionicons name={option.icon as any} size={24} color={option.color} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
}); 
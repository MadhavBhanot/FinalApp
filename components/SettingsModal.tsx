import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  ActivityIndicator,
  Switch,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { PrivacySettingsModal } from './PrivacySettingsModal';
import { useActivityStatus } from '@/contexts/ActivityStatus';

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function SettingsModal({ isVisible, onClose }: SettingsModalProps) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { isActive, setIsActive } = useActivityStatus();

  const handleDeactivateAccount = async () => {
    try {
      setDeactivating(true);
      setPasswordError(null);
      
      await signOut();
      router.replace('/(auth)/signin');
      
    } catch (error: any) {
      setPasswordError('Failed to deactivate account. Please try again.');
      console.error('Account deactivation error:', error);
    } finally {
      setDeactivating(false);
    }
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
      onPress: () => setShowPrivacyModal(true)
    },
    {
      icon: 'shield-outline',
      label: 'Security',
      color: '#FFC107',
      bgColor: 'rgba(255, 193, 7, 0.15)',
      onPress: () => Alert.alert('Coming Soon', 'Security settings will be available soon!')
    },
    {
      icon: 'close-outline',
      label: 'Deactivate Account',
      color: '#FF5252',
      bgColor: 'rgba(255, 82, 82, 0.15)',
      onPress: () => setShowDeactivateModal(true)
    }
  ];

  return (
    <>
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

      <PrivacySettingsModal 
        isVisible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      <Modal
        visible={showDeactivateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeactivateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Deactivate Account</Text>
            <Text style={styles.modalDescription}>
              Enter your password to deactivate your account. You can reactivate your account at any time by signing in again.
            </Text>
            
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor="#666"
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError(null);
              }}
            />
            
            {passwordError && (
              <Text style={styles.errorText}>{passwordError}</Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeactivateModal(false);
                  setPassword('');
                  setPasswordError(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.deactivateButton,
                  (!password || deactivating) && styles.disabledButton
                ]}
                onPress={handleDeactivateAccount}
                disabled={!password || deactivating}
              >
                {deactivating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>Deactivate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  settingSection: {
    marginBottom: 24,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
  },
  settingControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  optionsList: {
    flexDirection: 'row',
    gap: 12,
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
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  passwordInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 12,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 14,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  deactivateButton: {
    backgroundColor: '#FF5252',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  forgotPasswordText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
}); 
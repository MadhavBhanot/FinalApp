import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  Switch,
  Animated,
  Dimensions,
  Platform,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PrivacySettingsModal } from './PrivacySettingsModal';
import { useActivityStatus } from '@/contexts/ActivityStatus';
import { NotificationSettingsModal } from './NotificationSettingsModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function SettingsModal({ isVisible, onClose }: SettingsModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [email, setEmail] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { isActive, setIsActive } = useActivityStatus();

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

  const settings = [
    {
      id: 'privacy',
      title: 'Privacy Settings',
      description: 'Profile visibility and content access',
      icon: 'shield-checkmark',
      color: '#2196F3',
      type: 'navigate',
      onPress: () => setShowPrivacyModal(true)
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage your notification preferences',
      icon: 'notifications',
      color: '#FF9800',
      type: 'navigate',
      onPress: () => setShowNotificationModal(true)
    },
    {
      id: 'deactivate',
      title: 'Deactivate Account',
      description: 'Temporarily disable your account',
      icon: 'warning',
      color: '#FF5252',
      type: 'navigate',
      onPress: () => setShowDeactivateModal(true)
    }
  ];

  const handleDeactivateAccount = async () => {
    if (!deactivatePassword) {
      setPasswordError('Please enter your password');
      return;
    }

    try {
      setIsDeactivating(true);
      setPasswordError(null);
      
      // Add your deactivation logic here
      
      await signOut();
      router.replace('/(auth)/signin');
    } catch (error: any) {
      setPasswordError('Failed to deactivate account. Please check your password and try again.');
      console.error('Account deactivation error:', error);
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      // Add your password reset logic here
      
      Alert.alert(
        'Password Reset',
        'If an account exists for this email, you will receive password reset instructions.',
        [{ text: 'OK', onPress: () => setShowForgotPasswordModal(false) }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send password reset email. Please try again.');
    }
  };

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
            <Text style={styles.title}>Privacy & Security</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {settings.map((setting) => (
              <TouchableOpacity
                key={setting.id}
                style={styles.settingItem}
                onPress={setting.type === 'navigate' ? setting.onPress : undefined}
              >
                <View style={styles.settingIcon}>
                  <LinearGradient
                    colors={[`${setting.color}20`, `${setting.color}10`]}
                    style={styles.iconGradient}
                  >
                    <Ionicons name={setting.icon as any} size={24} color={setting.color} />
                  </LinearGradient>
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  <Text style={styles.settingDescription}>{setting.description}</Text>
                </View>
                {setting.type === 'switch' ? (
                  <Switch
                    value={setting.value}
                    onValueChange={setting.onValueChange}
                    trackColor={{ false: '#767577', true: `${setting.color}50` }}
                    thumbColor={setting.value ? setting.color : '#f4f3f4'}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>

      <PrivacySettingsModal
        isVisible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      <NotificationSettingsModal
        isVisible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
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
              value={deactivatePassword}
              onChangeText={(text) => {
                setDeactivatePassword(text);
                setPasswordError(null);
              }}
            />
            
            {passwordError && (
              <Text style={styles.errorText}>{passwordError}</Text>
            )}

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => {
                setShowDeactivateModal(false);
                setShowForgotPasswordModal(true);
              }}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeactivateModal(false);
                  setDeactivatePassword('');
                  setPasswordError(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.deactivateButton,
                  isDeactivating && styles.disabledButton
                ]}
                onPress={handleDeactivateAccount}
                disabled={isDeactivating}
              >
                <Text style={styles.modalButtonText}>
                  {isDeactivating ? 'Deactivating...' : 'Deactivate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showForgotPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalDescription}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
            
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowForgotPasswordModal(false);
                  setEmail('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.deactivateButton]}
                onPress={handleForgotPassword}
              >
                <Text style={styles.modalButtonText}>Send Reset Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#1A1A1A',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    width: '100%',
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
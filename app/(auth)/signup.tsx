import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSignUp, useOAuth, useAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";

// Removed unused import of SignUpResource
WebBrowser.maybeCompleteAuthSession();

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const theme = useColorScheme() ?? 'light';
  const { startOAuthFlow: googleAuth } = useOAuth({ 
    strategy: "oauth_google",
    redirectUrl: Platform.select({
      native: 'your-app-scheme://oauth-native-callback',
      web: 'http://localhost:8081/oauth-callback'
    })
  });
  const { startOAuthFlow: githubAuth } = useOAuth({ 
    strategy: "oauth_github",
    redirectUrl: Platform.select({
      native: 'your-app-scheme://oauth-native-callback',
      web: 'http://localhost:8081/oauth-callback'
    })
  });
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [pendingSignUpAttempt, setPendingSignUpAttempt] = useState<any>(null);
  const [showDataModal, setShowDataModal] = useState(false);
  const [username, setUsername] = useState('');

  const onSelectAuth = async (strategy: 'oauth_google' | 'oauth_github') => {
    try {
      const selectedAuth = strategy === 'oauth_google' ? googleAuth : githubAuth;
      if (!selectedAuth) return;

      const { createdSessionId, setActive: oauthSetActive } = await selectedAuth();
      
      if (createdSessionId && oauthSetActive) {
        await oauthSetActive({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error("OAuth error:", err);
    }
  };

  const handleSignUp = async () => {
    if (!isLoaded || !email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Create the user
      const signUpAttempt = await signUp.create({
        emailAddress: email,
        password,
        firstName: fullName.split(' ')[0],
        lastName: fullName.split(' ').slice(1).join(' '),
        username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') // Try setting username initially
      });

      if (signUpAttempt.status === "missing_requirements") {
        await signUpAttempt.prepareEmailAddressVerification();
        setPendingSignUpAttempt(signUpAttempt);
        setVerificationModalVisible(true);
      } else if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/(tabs)/');
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      Alert.alert(
        'Error',
        err.message || 'Unable to create account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async () => {
    if (!verificationCode || !pendingSignUpAttempt) {
      Alert.alert('Error', 'Please enter verification code');
      return;
    }
    
    setVerifyingCode(true);
    try {
      // First verify the email
      const verification = await pendingSignUpAttempt.attemptEmailAddressVerification({
        code: verificationCode,
      });

      console.log("Verification response:", verification);

      // Handle missing username requirement
      if (verification.status === "missing_requirements" && 
          verification.missingFields.includes("username")) {
        try {
          // Generate a unique username
          const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          const timestamp = new Date().getTime().toString().slice(-4);
          const username = `${baseUsername}${timestamp}`;

          // Update the signup with username
          await pendingSignUpAttempt.update({
            username: username
          });

          // Now complete the signup
          const completeSignUp = await pendingSignUpAttempt.create();
          
          if (completeSignUp.status === "complete") {
            await setActive({ session: completeSignUp.createdSessionId });
            setVerificationModalVisible(false);
            router.replace('/(tabs)/');
          } else {
            throw new Error('Failed to complete signup');
          }
        } catch (error: any) {
          console.error("Signup completion error:", error);
          Alert.alert(
            'Error',
            'Failed to complete signup. Please try again.'
          );
        }
      } else if (verification.status === "complete") {
        await setActive({ session: verification.createdSessionId });
        setVerificationModalVisible(false);
        router.replace('/(tabs)/');
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      
      if (err.message?.includes('already verified')) {
        setVerificationModalVisible(false);
        Alert.alert(
          'Already Verified',
          'Your email is already verified. Please sign in.',
          [{
            text: 'OK',
            onPress: () => router.replace('/(auth)/signin')
          }]
        );
      } else {
        Alert.alert(
          'Verification Failed', 
          'Please check the code and try again.'
        );
      }
    } finally {
      setVerifyingCode(false);
    }
  };

  // Update the OAuth buttons styling
  const socialButtonStyle = (provider: string) => [
    styles.socialButton,
    Platform.OS === 'web' && {
      backgroundColor: 'transparent',
      transition: 'background-color 0.3s ease',
      ':hover': {
        backgroundColor: '#f5f5f5'
      }
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <View style={styles.illustrationContainer}>
        <Svg height="180" width="180" viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" stroke="#6C63FF" strokeWidth="0.5" fill="none" />
          <Path
            d="M35,50 C35,35 65,35 65,50 C65,65 35,65 35,50"
            stroke="#6C63FF"
            strokeWidth="2"
            fill="none"
          />
          <Circle cx="50" cy="35" r="5" fill="#6C63FF" />
        </Svg>
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[theme].text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: Colors[theme].text }]}>
          Start your learning journey today
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, { 
            backgroundColor: Colors[theme].background,
            borderColor: Colors[theme].border,
            color: Colors[theme].text
          }]}
          placeholder="Full Name"
          placeholderTextColor={Colors[theme].text}
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={[styles.input, { 
            backgroundColor: Colors[theme].background,
            borderColor: Colors[theme].border,
            color: Colors[theme].text
          }]}
          placeholder="Email"
          placeholderTextColor={Colors[theme].text}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={[styles.input, { 
            backgroundColor: Colors[theme].background,
            borderColor: Colors[theme].border,
            color: Colors[theme].text
          }]}
          placeholder="Password"
          placeholderTextColor={Colors[theme].text}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity 
          style={[
            styles.button, 
            loading && { opacity: 0.7 },
            Platform.select({
              web: {
                pointerEvents: loading ? 'none' : 'auto'
              }
            })
          ]}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={[styles.dividerText, { color: Colors[theme].text }]}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialButtons}>
          <TouchableOpacity 
            style={[
              styles.socialButton,
              loading && styles.disabledButton,
              { backgroundColor: Colors[theme].background }
            ]}
            onPress={() => onSelectAuth('oauth_google')}
            disabled={loading}
          >
            <View style={styles.socialButtonContent}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <Path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <Path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <Path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </Svg>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.socialButton,
              loading && styles.disabledButton,
              { backgroundColor: Colors[theme].background }
            ]}
            onPress={() => onSelectAuth('oauth_github')}
            disabled={loading}
          >
            <View style={styles.socialButtonContent}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.24.73-.53v-1.85c-3.03.66-3.67-1.45-3.67-1.45-.5-1.26-1.21-1.6-1.21-1.6-.98-.67.08-.66.08-.66 1.09.08 1.66 1.12 1.66 1.12.96 1.65 2.53 1.17 3.15.89.1-.7.38-1.17.69-1.44-2.42-.28-4.96-1.21-4.96-5.4 0-1.19.42-2.17 1.12-2.93-.11-.28-.49-1.39.11-2.89 0 0 .92-.3 3 1.12a10.5 10.5 0 015.52 0c2.08-1.42 3-.12 3-.12.6 1.5.22 2.61.11 2.89.7.76 1.12 1.74 1.12 2.93 0 4.2-2.55 5.12-4.98 5.39.39.34.74 1.01.74 2.03v3.01c0 .29.19.63.74.53A11 11 0 0012 1.27"
                  fill={Colors[theme].text}
                />
              </Svg>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: Colors[theme].text }]}>
          Already have an account?{' '}
        </Text>
        <Link href="/(auth)/signin" asChild>
          <TouchableOpacity>
            <Text style={styles.link}>Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={verificationModalVisible}
        onRequestClose={() => setVerificationModalVisible(false)}
      >
        <View 
          style={[
            styles.modalOverlay,
            { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
          ]}
        >
          <View 
            style={[
              styles.modalContent,
              { backgroundColor: Colors[theme].background }
            ]}
          >
            <Text style={[styles.modalTitle, { color: Colors[theme].text }]}>
              Enter Verification Code
            </Text>
            <Text style={[styles.modalSubtitle, { color: Colors[theme].text }]}>
              Please enter the code sent to your email
            </Text>
            
            <TextInput
              style={[styles.verificationInput, { 
                backgroundColor: Colors[theme].background,
                borderColor: Colors[theme].border,
                color: Colors[theme].text
              }]}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="Enter code"
              placeholderTextColor={Colors[theme].text}
              keyboardType="number-pad"
              autoComplete="sms-otp"
              maxLength={6}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setVerificationModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleVerificationSubmit}
                disabled={verifyingCode}
              >
                {verifyingCode ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showDataModal}
        onRequestClose={() => setShowDataModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors[theme].background }]}>
            <Text style={[styles.modalTitle, { color: Colors[theme].text }]}>
              Additional Information
            </Text>
            <Text style={[styles.modalSubtitle, { color: Colors[theme].text }]}>
              Please provide a username to complete your profile
            </Text>
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: Colors[theme].background,
                borderColor: Colors[theme].border,
                color: Colors[theme].text
              }]}
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              placeholderTextColor={Colors[theme].text}
              autoCapitalize="none"
            />

            <TouchableOpacity 
              style={styles.button}
              onPress={async () => {
                try {
                  await signUpAttempt.update({
                    username: username
                  });
                  const completeSignUp = await signUpAttempt.create();
                  if (completeSignUp.status === "complete") {
                    await setActive({ session: completeSignUp.createdSessionId });
                    setShowDataModal(false);
                    router.replace('/(tabs)/');
                  }
                } catch (error) {
                  Alert.alert('Error', 'Failed to update profile');
                }
              }}
            >
              <Text style={styles.buttonText}>Complete Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'opacity 0.2s ease'
    } : {})
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1E1E1E',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    })
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...(Platform.OS === 'web' ? {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000
    } : {})
  },
  modalContent: {
    width: Platform.OS === 'web' ? '100%' : '90%',
    maxWidth: 500,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
      backgroundColor: '#fff'
    } : {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    })
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
    textAlign: 'center',
  },
  verificationInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'opacity 0.2s ease'
    } : {})
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  submitButton: {
    backgroundColor: '#6C63FF',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
    ...(Platform.OS === 'web' && {
      cursor: 'not-allowed'
    })
  },
}); 
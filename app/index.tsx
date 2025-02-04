import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Link } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import 'expo-router/entry';

export default function Index() {
  const [termsModalVisible, setTermsModalVisible] = useState<boolean>(false);
  const theme = 'dark';
  const scaleAnim = new Animated.Value(1);
  const opacityAnim = new Animated.Value(1);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 20,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ])
    ]).start(() => setAnimationComplete(true));
  }, []);

  const containerStyle = {
    ...styles.container,
    backgroundColor: Colors[theme].background,
  };

  const handleButtonPress = (e: any) => {
    if (!termsAccepted) {
      e.preventDefault();
      Alert.alert('Terms Required', 'Please accept the terms and conditions to continue.');
      return;
    }
  };

  return (
    <View style={containerStyle}>
      {!animationComplete && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#6C63FF',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
              zIndex: 1,
            },
          ]}
        >
          <Svg height="80" width="80" viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="40" fill="#000" opacity="0.9" />
          </Svg>
        </Animated.View>
      )}
      
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        <View style={styles.artworkContainer}>
          <Svg height="280" width="280" viewBox="0 0 100 100">
            {/* Brain/Network representation */}
            <Path
              d="M20,50 Q35,20 50,50 Q65,80 80,50"
              fill="none"
              stroke="#6C63FF"
              strokeWidth="1"
              opacity="0.7"
            />
            
            {/* Learning nodes */}
            <Circle cx="35" cy="40" r="3" fill="#6C63FF" />
            <Circle cx="50" cy="50" r="3" fill="#6C63FF" />
            <Circle cx="65" cy="40" r="3" fill="#6C63FF" />
            
            {/* Growth lines */}
            <Path
              d="M35,40 L50,50 L65,40"
              stroke="#6C63FF"
              strokeWidth="0.5"
              opacity="0.5"
            />
            
            {/* Abstract book shape */}
            <Path
              d="M30,60 L70,60 L70,75 Q50,65 30,75 Z"
              fill="none"
              stroke="#6C63FF"
              strokeWidth="0.8"
            />
            
            {/* Progress circles */}
            <Circle cx="50" cy="30" r="15" 
              stroke="#6C63FF" 
              strokeWidth="0.5" 
              strokeDasharray="2,2"
              fill="none" 
            />
            <Circle cx="50" cy="30" r="10" 
              stroke="#6C63FF" 
              strokeWidth="0.5" 
              fill="none" 
            />
            
            {/* Ladder of success */}
            <Path
              d="M75,25 L75,75 M80,25 L80,75"
              stroke={Colors[theme].text}
              strokeWidth="0.3"
              opacity="0.2"
            />
            <Path
              d="M75,35 L80,35 M75,45 L80,45 M75,55 L80,55 M75,65 L80,65"
              stroke={Colors[theme].text}
              strokeWidth="0.5"
              opacity="0.3"
            />
          </Svg>
        </View>

        <Text style={[styles.title, { color: Colors[theme].text }]}>
          learn & evolve
        </Text>
        <Text style={[styles.subtitle, { color: Colors[theme].text }]}>
          your path to success starts here
        </Text>

        <Link 
          href="/(auth)/signin" 
          asChild
          onPress={handleButtonPress}
        >
          <TouchableOpacity 
            style={[
              styles.continueButton,
              !termsAccepted && styles.continueButtonDisabled
            ]}
            disabled={!termsAccepted}
          >
            <Text style={[
              styles.buttonText,
              !termsAccepted && styles.buttonTextDisabled
            ]}>
              Start Learning
            </Text>
          </TouchableOpacity>
        </Link>

        <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={styles.checkbox}
            onPress={() => setTermsAccepted(prev => !prev)}
            activeOpacity={0.8}
          >
            <View style={[
              styles.checkboxInner,
              termsAccepted && styles.checkboxChecked
            ]}>
              {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setTermsModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.termsText, { color: Colors[theme].text }]}>
              Terms and Conditions
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={termsModalVisible}
          onRequestClose={() => setTermsModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.modalView, { backgroundColor: '#1E1E1E' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: Colors[theme].text }]}>Terms and Conditions</Text>
                <TouchableOpacity
                  style={styles.closeIconButton}
                  onPress={() => setTermsModalVisible(false)}
                >
                  <Text style={{ color: Colors[theme].text, fontSize: 20 }}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.termsSection}>
                  <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>1. Account Usage</Text>
                  <View style={styles.bulletPoints}>
                    <Text style={[styles.bulletPoint, { color: Colors[theme].text }]}>• You must be 13 years or older to use this service</Text>
                    <Text style={[styles.bulletPoint, { color: Colors[theme].text }]}>• You are responsible for maintaining account security</Text>
                    <Text style={[styles.bulletPoint, { color: Colors[theme].text }]}>• One account per user is permitted</Text>
                  </View>
                </View>

                <View style={styles.termsSection}>
                  <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>2. Content & Privacy</Text>
                  <View style={styles.bulletPoints}>
                    <Text style={[styles.bulletPoint, { color: Colors[theme].text }]}>• Your data is protected according to our privacy policy</Text>
                    <Text style={[styles.bulletPoint, { color: Colors[theme].text }]}>• We respect your intellectual property rights</Text>
                    <Text style={[styles.bulletPoint, { color: Colors[theme].text }]}>• Content shared must be appropriate and legal</Text>
                  </View>
                </View>

                <View style={styles.termsSection}>
                  <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>3. Learning Materials</Text>
                  <View style={styles.bulletPoints}>
                    <Text style={[styles.bulletPoint, { color: Colors[theme].text }]}>• Materials are for personal use only</Text>
                    <Text style={[styles.bulletPoint, { color: Colors[theme].text }]}>• No redistribution without permission</Text>
                    <Text style={[styles.bulletPoint, { color: Colors[theme].text }]}>• Content may be updated periodically</Text>
                  </View>
                </View>

                <View style={styles.termsSection}>
                  <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>4. User Conduct</Text>
                  <View style={styles.bulletPoints}>
                    <Text style={[styles.bulletPoint, { color: Colors[theme].text }]}>• Be respectful to other learners</Text>
                    <Text style={[styles.bulletPoint, { color: Colors[theme].text }]}>• Do not share account credentials</Text>
                    <Text style={[styles.bulletPoint, { color: Colors[theme].text }]}>• Report inappropriate content</Text>
                  </View>
                </View>

                <View style={styles.termsSection}>
                  <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>5. Subscription</Text>
                  <View style={styles.bulletPoints}>
                    <Text style={[styles.bulletPoint, { color: Colors[theme].text }]}>• Free trial available for new users</Text>
                    <Text style={[styles.bulletPoint, { color: Colors[theme].text }]}>• Cancel anytime</Text>
                    <Text style={[styles.bulletPoint, { color: Colors[theme].text }]}>• Refunds per our refund policy</Text>
                  </View>
                </View>

                <Text style={[styles.lastUpdated, { color: Colors[theme].text }]}>
                  Last updated: March 2024
                </Text>
              </ScrollView>

              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => {
                  setTermsModalVisible(false);
                }}
              >
                <Text style={styles.acceptButtonText}>I Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0A0A0A',
  },
  artworkContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 1,
    textTransform: 'lowercase',
  },
  subtitle: {
    fontSize: 17,
    marginBottom: 40,
    letterSpacing: 0.5,
    opacity: 0.8,
    fontWeight: '400',
  },
  button: {
    width: 200,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  buttonDisabled: {
    backgroundColor: '#9995CC',
    opacity: 0.5,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  termsText: {
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 0,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    backgroundColor: '#1E1E1E',
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeIconButton: {
    padding: 5,
  },
  scrollView: {
    width: '100%',
    paddingHorizontal: 20,
  },
  termsSection: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 10,
  },
  bulletPoints: {
    paddingLeft: 10,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
    opacity: 0.8,
  },
  lastUpdated: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    marginVertical: 20,
  },
  acceptButton: {
    backgroundColor: '#6C63FF',
    width: '100%',
    padding: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  checkboxChecked: {
    backgroundColor: '#6C63FF',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonTextDisabled: {
    color: '#4B4B4B',
  },
  continueButton: {
    backgroundColor: '#5B21B6',
    paddingHorizontal: 60,
    paddingVertical: 16,
    borderRadius: 100,
    marginBottom: 30,
    width: 280,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  continueButtonDisabled: {
    backgroundColor: '#1F1F1F',
    opacity: 1,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
});

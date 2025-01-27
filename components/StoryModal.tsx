import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StoryModalProps {
  isVisible: boolean;
  onClose: () => void;
  storyImage?: string;
  isCreating?: boolean;
}

export function StoryModal({ isVisible, onClose, storyImage, isCreating }: StoryModalProps) {
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isVisible && !isCreating && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isVisible, isCreating]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      // Handle the story creation here
      // You'll need to implement story storage logic
      onClose();
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {isCreating ? (
          <TouchableOpacity style={styles.createContainer} onPress={pickImage}>
            <Ionicons name="add-circle-outline" size={48} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.storyContainer}>
            <Image 
              source={{ uri: storyImage }} 
              style={styles.storyImage}
              resizeMode="cover"
            />
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(timeLeft / 10) * 100}%` }
                ]} 
              />
            </View>
          </View>
        )}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  createContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  storyContainer: {
    flex: 1,
  },
  storyImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
  },
  progressBar: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1,
  },
}); 
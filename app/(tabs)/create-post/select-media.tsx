import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SelectMedia() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const saveImage = async (uri: string) => {
    try {
      const filename = uri.split('/').pop();
      const newPath = `${FileSystem.documentDirectory}images/${filename}`;
      
      // Create images directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}images`);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}images`, {
          intermediates: true
        });
      }

      // Copy image to new location
      await FileSystem.copyAsync({
        from: uri,
        to: newPath
      });

      return newPath;
    } catch (error) {
      console.error('Error saving image:', error);
      throw error;
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to create a post!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        aspect: [1, 1],
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const savedImageUri = await saveImage(result.assets[0].uri);
        setSelectedImage(savedImageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Error selecting image. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity 
          style={[styles.nextButton, !selectedImage && styles.nextButtonDisabled]}
          onPress={() => {
            if (selectedImage) {
              router.push({
                pathname: '/(tabs)/create-post/edit-media',
                params: { 
                  imageUri: encodeURIComponent(selectedImage)
                }
              });
            }
          }}
          disabled={!selectedImage}
        >
          <Text style={[styles.nextButtonText, !selectedImage && styles.nextButtonTextDisabled]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {selectedImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.previewImage}
              resizeMode="contain"
            />
            <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
              <Ionicons name="camera-outline" size={24} color="#fff" />
              <Text style={styles.changeButtonText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.selectButton} onPress={pickImage}>
            <Ionicons name="images-outline" size={40} color="#6C63FF" />
            <Text style={styles.selectButtonText}>Select from Gallery</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  nextButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  nextButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  nextButtonTextDisabled: {
    color: '#666',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imagePreviewContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButton: {
    alignItems: 'center',
    gap: 12,
  },
  selectButtonText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: '80%',
    borderRadius: 12,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginTop: 20,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
}); 
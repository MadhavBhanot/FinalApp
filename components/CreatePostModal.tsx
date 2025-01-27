import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { usePosts } from '@/contexts/posts';
import { useUser } from '@clerk/clerk-expo';

interface CreatePostModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function CreatePostModal({ isVisible, onClose }: CreatePostModalProps) {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const { addPost } = usePosts();
  const { user } = useUser();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    try {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to post');
        return;
      }

      const primaryEmail = user.primaryEmailAddress?.emailAddress || '';
      const username = primaryEmail.split('@')[0];

      const newPost = {
        imageUri: image,
        description,
        location: '',
        tags: [],
        userId: user.id,
        username: username,
        userImage: user.imageUrl || 'https://via.placeholder.com/100',
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
        isLiked: false
      };

      console.log('Creating post with username:', username);
      await addPost(newPost);
      setImage(null);
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>New Post</Text>
          <TouchableOpacity onPress={handlePost}>
            <Text style={styles.postButton}>Post</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {user && (
            <View style={styles.userInfo}>
              <Image 
                source={{ uri: user.imageUrl || 'https://via.placeholder.com/100' }}
                style={styles.userImage}
              />
              <Text style={styles.username}>
                {user.primaryEmailAddress?.emailAddress.split('@')[0]}
              </Text>
            </View>
          )}

          {image ? (
            <ScrollView style={styles.imageContainer}>
              <Image 
                source={{ uri: image }} 
                style={styles.selectedImage}
                resizeMode="contain"
              />
            </ScrollView>
          ) : (
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Ionicons name="image" size={48} color="#666" />
              <Text style={styles.imagePickerText}>Select Image</Text>
            </TouchableOpacity>
          )}

          <TextInput
            style={styles.input}
            placeholder="Write a caption..."
            placeholderTextColor="#666"
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  postButton: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imagePicker: {
    aspectRatio: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePickerText: {
    color: '#666',
    marginTop: 8,
  },
  selectedImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    borderRadius: 12,
  },
  input: {
    color: '#fff',
    fontSize: 16,
    minHeight: 80,
    maxHeight: 120,
    paddingTop: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    marginBottom: 16,
  },
}); 
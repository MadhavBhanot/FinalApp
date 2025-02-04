import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, Dimensions, Platform, Alert, Modal } from 'react-native';
import { useLocalSearchParams, router, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { auth } from "@/lib/api";
import { createPost } from "@/lib/api/posts";
import { usePosts } from '@/contexts/posts';
import * as FileSystem from 'expo-file-system';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Tag {
  id: string;
  name: string;
}

export default function AddDetails() {
  const { addPost } = usePosts();
  const { user } = useUser();
  const params = useLocalSearchParams();
  const imageUri = decodeURIComponent(params.imageUri as string);
  const cssFilters = params.cssFilters as string | undefined;
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState('');
  const [currentTag, setCurrentTag] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userObjectId, setUserObjectId] = useState<string | null>(null);
  const router = useRouter();

  // Get MongoDB user ID when component mounts
  useEffect(() => {
    const initUser = async () => {
      if (!user) return;
      try {
        const response = await auth.initializeBackendSession(user);
        if (response.data.user._id) {
          setUserObjectId(response.data.user._id);
          console.log('✅ Set MongoDB User ID:', response.data.user._id);
        }
      } catch (error) {
        console.error('❌ Error getting MongoDB user ID:', error);
      }
    };
    initUser();
  }, [user]);

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.find(t => t.name === currentTag.trim())) {
      setTags([...tags, { id: Date.now().toString(), name: currentTag.trim() }]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter(tag => tag.id !== tagId));
  };

  const handleShare = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Image is required');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Caption is required');
      return;
    }

    if (!userObjectId) {
      Alert.alert('Error', 'Please wait for authentication to complete');
      return;
    }

    try {
      setIsLoading(true);
      
      // Convert image to base64 if it isn't already
      let base64Image = imageUri;
      if (!imageUri.startsWith('data:image')) {
        const base64Data = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64
        });
        base64Image = `data:image/jpeg;base64,${base64Data}`;
      }

      // Create FormData object
      const formData = new FormData();
      
      // Append required fields
      formData.append('image', base64Image);
      formData.append('caption', description.trim());
      formData.append('category', JSON.stringify(['Technology']));
      formData.append('author', userObjectId);

      // Append optional fields
      if (cssFilters) formData.append('filters', cssFilters);
      if (tags.length > 0) formData.append('tags', JSON.stringify(tags.map(t => t.name)));
      if (location) formData.append('location', location);

      console.log('🔄 Creating post with data:', {
        caption: description.trim(),
        category: ['Technology'],
        author: userObjectId,
        tags: tags.map(t => t.name),
        location,
        filters: cssFilters,
        imageLength: base64Image.length, // Log image length for debugging
      });
      
      const newPost = await createPost(formData);
      console.log('✅ Post created successfully:', newPost);

      // Navigate to profile tab
      router.push('/(tabs)/profile');
      
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Error', 'Failed to share post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity 
          style={[
            styles.postButton, 
            (tags.length === 0 || isLoading) && styles.postButtonDisabled
          ]}
          onPress={handleShare}
          disabled={tags.length === 0 || isLoading}
        >
          <Text style={[
            styles.postButtonText, 
            (tags.length === 0 || isLoading) && styles.postButtonTextDisabled
          ]}>
            {isLoading ? 'Posting...' : 'Share'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.previewSection}>
          <Image 
            source={{ uri: imageUri }}
            style={[styles.previewImage, cssFilters ? { filter: cssFilters } : {}]}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <Ionicons name="image" size={24} color="#fff" />
          </View>
        </View>

        <View style={styles.formSection}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor="#666"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={20} color="#6C63FF" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Add location..."
              placeholderTextColor="#666"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.tagsSection}>
            <View style={styles.tagInputContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="pricetags-outline" size={20} color="#6C63FF" />
              </View>
              <TextInput
                style={styles.tagInput}
                placeholder="Add tags..."
                placeholderTextColor="#666"
                value={currentTag}
                onChangeText={setCurrentTag}
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity onPress={handleAddTag} style={styles.addTagButton}>
                <Ionicons name="add-circle" size={24} color="#6C63FF" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.tagsScroll}
              contentContainerStyle={styles.tagsScrollContent}
            >
              {tags.map(tag => (
                <View key={tag.id} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag.name}</Text>
                  <TouchableOpacity 
                    onPress={() => handleRemoveTag(tag.id)}
                    style={styles.removeTagButton}
                  >
                    <Ionicons name="close-circle" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  postButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: 'rgba(108, 99, 255, 0.3)',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  postButtonTextDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
  content: {
    flex: 1,
  },
  previewSection: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#111',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  formSection: {
    padding: 16,
    gap: 20,
    backgroundColor: '#000',
  },
  captionInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
  },
  iconContainer: {
    padding: 12,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingHorizontal: 12,
    height: 44,
  },
  tagsSection: {
    gap: 12,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tagInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingHorizontal: 12,
    height: 44,
  },
  addTagButton: {
    padding: 12,
  },
  tagsScroll: {
    maxHeight: 40,
  },
  tagsScrollContent: {
    paddingHorizontal: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  tagText: {
    color: '#fff',
    marginRight: 4,
  },
  removeTagButton: {
    marginLeft: 4,
  },
}); 
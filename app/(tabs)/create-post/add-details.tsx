import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { usePosts } from '@/contexts/posts';

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
  const cssFilters = params.cssFilters as string;
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [currentTag, setCurrentTag] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.find(t => t.name === currentTag.trim())) {
      setTags([...tags, { id: Date.now().toString(), name: currentTag.trim() }]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter(tag => tag.id !== tagId));
  };

  const handlePost = () => {
    if (tags.length === 0) {
      alert('Please add at least one tag');
      return;
    }

    try {
      addPost({
        imageUri,
        description,
        location,
        tags: tags.map(t => t.name),
        userId: user?.id || '',
        filters: cssFilters,
        createdAt: new Date().toISOString()
      });

      // Navigate to profile and stay there
      router.replace('/(tabs)/profile');

      // Reset create post state in the background
      setTimeout(() => {
        setDescription('');
        setLocation('');
        setCurrentTag('');
        setTags([]);
      }, 500);

    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
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
          style={[styles.postButton, tags.length === 0 && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={tags.length === 0}
        >
          <Text style={[styles.postButtonText, tags.length === 0 && styles.postButtonTextDisabled]}>
            Share
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
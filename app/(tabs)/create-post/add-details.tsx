import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { usePosts } from '@/contexts/posts';

interface Tag {
  id: string;
  name: string;
}

interface Post {
  id: string;
  imageUri: string;
  description: string;
  location: string;
  tags: string[];
  userId: string;
  filters?: string;
  createdAt: string;
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

      router.replace('/(tabs)/profile');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity 
          style={[styles.postButton, tags.length === 0 && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={tags.length === 0}
        >
          <Text style={[styles.postButtonText, tags.length === 0 && styles.postButtonTextDisabled]}>
            Post
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.imagePreview}>
          <Image 
            source={{ uri: imageUri }}
            style={[
              styles.previewImage,
              cssFilters ? { filter: cssFilters } : {}
            ]}
            resizeMode="contain"
          />
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={24} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Add location"
              placeholderTextColor="#666"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Write a caption..."
            placeholderTextColor="#666"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.tagsSection}>
            <Text style={styles.tagsTitle}>Tags</Text>
            <View style={styles.tagInput}>
              <TextInput
                style={styles.tagInputField}
                placeholder="Add tags..."
                placeholderTextColor="#666"
                value={currentTag}
                onChangeText={setCurrentTag}
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity onPress={handleAddTag}>
                <Ionicons name="add-circle" size={24} color="#6C63FF" />
              </TouchableOpacity>
            </View>

            <View style={styles.tagsList}>
              {tags.map(tag => (
                <View key={tag.id} style={styles.tag}>
                  <Text style={styles.tagText}>{tag.name}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag.id)}>
                    <Ionicons name="close-circle" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
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
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  postButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  postButtonTextDisabled: {
    color: '#666',
  },
  content: {
    flex: 1,
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#111',
    marginBottom: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  form: {
    padding: 16,
    gap: 16,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  tagsSection: {
    gap: 8,
  },
  tagsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  tagInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
  },
  tagInputField: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginRight: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
}); 
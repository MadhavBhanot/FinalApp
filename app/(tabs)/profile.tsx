import React, { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView, Dimensions, Modal, TextInput, Alert, FlatList, SafeAreaView, Platform, RefreshControl } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '@/lib/api/index';
import { 
  getUserPosts,
  getPostById,
  toggleLike,
  createPost,
  deletePost,
  Post
} from '@/lib/api/posts';

import PostModal from '@/components/PostModal';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POST_WIDTH = (SCREEN_WIDTH - 80) / 3; // 16px padding on each side, 8px gap between posts

interface PostModalPost {
  id: string;
  imageUri: string;
  description: string;
  location?: string;
  tags?: string[];
  userId: string;
  username: string;
  userImage: string;
  filters?: string;
  createdAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

interface UserProfile {
  _id: string;
  username: string;
  profileImg?: string;
}

const TEST_FOLLOWERS: UserProfile[] = [
  { _id: '1', username: 'john_doe', profileImg: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { _id: '2', username: 'jane_smith', profileImg: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { _id: '3', username: 'mike_wilson', profileImg: 'https://randomuser.me/api/portraits/men/3.jpg' },
  { _id: '4', username: 'sarah_parker', profileImg: 'https://randomuser.me/api/portraits/women/4.jpg' },
  { _id: '5', username: 'alex_turner', profileImg: 'https://randomuser.me/api/portraits/men/5.jpg' },
];

const TEST_FOLLOWING: UserProfile[] = [
  { _id: '6', username: 'emma_watson', profileImg: 'https://randomuser.me/api/portraits/women/6.jpg' },
  { _id: '7', username: 'tom_hardy', profileImg: 'https://randomuser.me/api/portraits/men/7.jpg' },
  { _id: '8', username: 'lisa_kudrow', profileImg: 'https://randomuser.me/api/portraits/women/8.jpg' },
  { _id: '9', username: 'chris_evans', profileImg: 'https://randomuser.me/api/portraits/men/9.jpg' },
];

const formatImageUri = (uri: string) => {
  if (!uri) return '';
  
  // Log the incoming URI for debugging
  console.log('🔄 Formatting image URI:', uri);
  
  // If it's already a complete URL (http/https), return as is
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  
  // If it's already a complete data URI, return as is
  if (uri.startsWith('data:image')) {
    return uri;
  }
  
  // If it's a base64 string without the data URI prefix, add it
  if (uri.match(/^[A-Za-z0-9+/=]+$/)) {
    return `data:image/jpeg;base64,${uri}`;
  }
  
  // If it's a relative path, construct the full URL (adjust the base URL as needed)
  if (uri.startsWith('/')) {
    return `http://10.0.2.2:5001${uri}`;  // Adjust this base URL to match your API
  }
  
  // For any other format, try to use as is
  return uri;
};

const fetchSinglePost = async (postId: string): Promise<Post | null> => {
  try {
    console.log('🔄 Fetching post details:', postId);
    const post = await getPostById(postId);
    
    if (!post) {
      console.error('❌ No post data received');
      return null;
    }
    
    console.log('✅ Post details received:', post);
    return post;
  } catch (error) {
    console.error('❌ Error fetching post:', error);
    Alert.alert('Error', 'Failed to load post details');
    return null;
  }
};

const POSTS_CACHE_KEY = 'user_posts_cache';

const cacheUserPosts = async (userId: string, posts: Post[]) => {
  try {
    const cacheData = {
      timestamp: Date.now(),
      posts,
    };
    await AsyncStorage.setItem(`${POSTS_CACHE_KEY}_${userId}`, JSON.stringify(cacheData));
    console.log('✅ Posts cached successfully');
  } catch (error) {
    console.error('❌ Error caching posts:', error);
  }
};

const getCachedPosts = async (userId: string): Promise<Post[] | null> => {
  try {
    const cachedData = await AsyncStorage.getItem(`${POSTS_CACHE_KEY}_${userId}`);
    if (!cachedData) return null;

    const { timestamp, posts } = JSON.parse(cachedData);
    // Cache expires after 5 minutes
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      return null;
    }
    console.log('✅ Using cached posts');
    return posts;
  } catch (error) {
    console.error('❌ Error reading cached posts:', error);
    return null;
  }
};

export default function Profile() {
  const { user, isLoaded } = useUser();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isInterestsModalVisible, setIsInterestsModalVisible] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    (user?.unsafeMetadata?.interests as string[]) || []
  );
  const [isEditBioModalVisible, setIsEditBioModalVisible] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [scale, setScale] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLiking, setIsLiking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userObjectId, setUserObjectId] = useState<string | null>(null);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [isFollowModalVisible, setIsFollowModalVisible] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');
  const router = useRouter();
  const pathname = usePathname();

  const AVAILABLE_INTERESTS = [
    { id: '1', name: 'Tech', icon: 'laptop-outline' },
    { id: '2', name: 'Productivity', icon: 'trending-up-outline' },
    { id: '3', name: 'Reading', icon: 'book-outline' },
    { id: '4', name: 'Fitness', icon: 'fitness-outline' },
    { id: '5', name: 'Coding', icon: 'code-slash-outline' },
    { id: '6', name: 'Design', icon: 'color-palette-outline' },
    { id: '7', name: 'Business', icon: 'briefcase-outline' },
    { id: '8', name: 'Writing', icon: 'create-outline' },
    { id: '9', name: 'Music', icon: 'musical-notes-outline' },
    { id: '10', name: 'Art', icon: 'brush-outline' },
  ];

  const fetchPosts = useCallback(async () => {
    if (!user?.id || isLoading) return;
    
    try {
      setIsLoading(true);
      
      // First try to get the stored MongoDB user ID
      let mongoUserId = await auth.getCurrentMongoUserId();
      
      // If no stored ID, try to initialize session
      if (!mongoUserId) {
        console.log('🔄 No stored MongoDB ID, initializing session...');
        const sessionResponse = await auth.initializeBackendSession(user);
        
        if (!sessionResponse?.success || !sessionResponse?.data?.user?._id) {
          console.error('❌ Failed to initialize session:', sessionResponse?.error);
          setPosts([]);
          return;
        }
        
        mongoUserId = sessionResponse.data.user._id;
      }
      
      setUserObjectId(mongoUserId);
      
      console.log('🔄 Fetching posts for user:', mongoUserId);
      const response = await getUserPosts(mongoUserId);
      console.log('✅ Posts response:', response);
      
      if (response?.posts && Array.isArray(response.posts)) {
        setPosts(response.posts);
      } else {
        console.log('ℹ️ No posts found');
        setPosts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch posts only once when component mounts and user is available
  useEffect(() => {
    if (user?.id && !posts.length) {
      fetchPosts();
    }
  }, [user?.id, posts.length]);

  // Only refresh posts when user explicitly requests it
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

  const handleUpdateBio = async () => {
    if (!user) return;
    
    try {
      await user.update({
        unsafeMetadata: { bio: newBio.trim() },
      });
      
      Alert.alert(
        'Success',
        'Bio updated successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsEditBioModalVisible(false);
            },
          },
        ],
      );
    } catch (error: any) {
      console.error('Bio update error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update bio. Please try again.'
      );
    }
  };

  const handleProfileImagePress = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingImage(true);
        try {
          const manipulatedImage = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [{ resize: { width: 500, height: 500 } }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
          );

          const formData = new FormData();
          formData.append('file', {
            name: 'profile-image.jpg',
            type: 'image/jpeg',
            uri: manipulatedImage.uri
          } as any);

          await user?.setProfileImage({ file: formData });
          Alert.alert('Success', 'Profile photo updated successfully');
        } catch (error: any) {
          console.error('Image upload error:', error);
          Alert.alert('Error', 'Failed to update profile photo');
        } finally {
          setIsUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleInterestSelection = async (interestName: string) => {
    let newInterests: string[];
    if (selectedInterests.includes(interestName)) {
      newInterests = selectedInterests.filter(i => i !== interestName);
    } else {
      newInterests = [...selectedInterests, interestName];
    }
    
    setSelectedInterests(newInterests);
    
    try {
      await user?.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          interests: newInterests,
        },
      });
    } catch (error) {
      console.error('Failed to update interests:', error);
      // Revert on failure
      setSelectedInterests(selectedInterests);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleLike = async (postId: string) => {
    if (!postId || isLiking) return;
    
    try {
      setIsLiking(true);
      const response = await toggleLike(postId);
      
      if (response.success) {
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? { ...post, isLiked: response.isLiked }
              : post
          )
        );

        if (selectedPost?._id === postId) {
          setSelectedPost(prev => prev ? {
            ...prev,
            isLiked: response.isLiked
          } : null);
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCreatePost = async (imageUri: string, caption: string, filters?: string) => {
    if (!user) return;
    
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'post.jpg',
      } as any);
      formData.append('caption', caption);
      if (filters) formData.append('filters', filters);
      
      console.log('🔄 Creating new post...');
      const newPost = await createPost(formData);
      console.log('✅ Post created:', newPost);
      
      // Update posts list with the new post
      setPosts(prevPosts => [newPost, ...prevPosts]);
      
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    }
  };

  const renderPosts = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      );
    }

    if (!posts || posts.length === 0) {
      return (
        <View style={styles.noPostsContainer}>
          <Text style={styles.noPostsText}>No posts yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.postsGrid}>
        {posts.map((post) => {
          // Add debug logging
          console.log('Rendering post:', {
            id: post._id,
            hasImage: Boolean(post.image),
            imageUrl: post.image
          });

          if (!post?._id) return null;

          return (
            <TouchableOpacity
              key={post._id}
              style={styles.postContainer}
              onPress={() => {
                console.log('Post clicked:', post);
                // Set the selected post directly without transformation
                setSelectedPost(post);
              }}
            >
              <Image
                source={{ 
                  uri: post.image || 'https://via.placeholder.com/300'
                }}
                style={styles.postImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderPostModal = () => {
    if (!selectedPost) return null;

    console.log('Rendering modal for post:', {
      id: selectedPost._id,
      image: selectedPost.image,
      author: selectedPost.author
    });

    return (
      <PostModal
        visible={Boolean(selectedPost)}
        post={selectedPost}
        onClose={() => {
          console.log('Closing modal');
          setSelectedPost(null);
        }}
        onLike={() => handleLike(selectedPost._id)}
        onComment={() => {}}
        onShare={() => {}}
        onPostDeleted={() => {
          setPosts(prevPosts => prevPosts.filter(p => p._id !== selectedPost._id));
          setSelectedPost(null);
        }}
      />
    );
  };

  const fetchFollowData = async () => {
    const currentUserId = userObjectId;
    if (!currentUserId) {
      console.log('No user ID available');
      return;
    }
    
    try {
      // Fetch followers
      const followersResponse = await fetch(`http://10.0.2.2:5001/api/users/followers/${currentUserId}`);
      const followersData = await followersResponse.json();
      if (followersData.Status === 1) {
        setFollowers(followersData.Followers);
      }

      // Fetch following
      const followingResponse = await fetch(`http://10.0.2.2:5001/api/users/following/${currentUserId}`);
      const followingData = await followingResponse.json();
      if (followingData.Status === 1) {
        setFollowing(followingData.Following);
      }
    } catch (error) {
      console.error('Error fetching follow data:', error);
    }
  };

  const handleFollowPress = async (userId: string) => {
    if (!userObjectId) return;
    
    try {
      const response = await fetch(`http://10.0.2.2:5001/api/users/follow/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      if (data.Status === 1) {
        // Refresh follow data after successful follow/unfollow
        fetchFollowData();
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const isFollowingUser = (userId: string) => {
    return following.some(user => user._id === userId);
  };

  const FollowModal = ({ visible, onClose, title, users, onFollowPress, isFollowing }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    users: UserProfile[];
    onFollowPress: (userId: string) => void;
    isFollowing: (userId: string) => boolean;
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.followModalContent}>
          <View style={styles.followModalHeader}>
            <Text style={styles.followModalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.followModalCloseButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={users}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <View style={styles.userListItem}>
                <View style={styles.userListInfo}>
                  {item.profileImg ? (
                    <Image
                      source={{ uri: item.profileImg }}
                      style={styles.userListAvatar}
                    />
                  ) : (
                    <View style={[styles.userListAvatar, styles.userListAvatarPlaceholder]}>
                      <Text style={styles.userListAvatarText}>
                        {item.username[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.userListUsername}>{item.username}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.userListFollowButton,
                    isFollowing(item._id) && styles.userListFollowingButton
                  ]}
                  onPress={() => onFollowPress(item._id)}
                >
                  <Text style={[
                    styles.userListFollowButtonText,
                    isFollowing(item._id) && styles.userListFollowingButtonText
                  ]}>
                    {isFollowing(item._id) ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            style={styles.userList}
          />
        </View>
      </View>
    </Modal>
  );

  // Update the useEffect to set test data
  useEffect(() => {
    setFollowers(TEST_FOLLOWERS);
    setFollowing(TEST_FOLLOWING);
  }, []);

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6C63FF']}
            tintColor="#6C63FF"
          />
        }
      >
        <LinearGradient
          colors={[
            'rgba(108, 99, 255, 0.2)',
            'rgba(255, 99, 216, 0.1)',
            'transparent'
          ]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setIsMenuVisible(true)}
          >
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.profileContent}>
            <View style={styles.profileSection}>
              <TouchableOpacity 
                style={styles.profileImageContainer}
                onPress={handleProfileImagePress}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    {user?.imageUrl ? (
                      <Image 
                        source={{ uri: user.imageUrl }} 
                        style={styles.profileImage}
                      />
                    ) : (
                      <View style={styles.profileImagePlaceholder}>
                        <Text style={styles.profileImagePlaceholderText}>
                          {user?.firstName?.[0] || user?.username?.[0] || '?'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.editImageButton}>
                      <Ionicons name="camera" size={16} color="#fff" />
                    </View>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.username}>
              {user?.username || 'Username'}
            </Text>
            <Text style={styles.bio}>
              {user?.unsafeMetadata?.bio || 'No bio yet'}
              <TouchableOpacity 
                onPress={() => {
                  setNewBio(user?.unsafeMetadata?.bio as string || '');
                  setIsEditBioModalVisible(true);
                }}
                style={styles.editBioButton}
              >
                <Ionicons name="pencil" size={14} color="#6C63FF" style={styles.editBioIcon} />
              </TouchableOpacity>
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => {
              setFollowModalType('followers');
              setIsFollowModalVisible(true);
            }}
          >
            <Text style={styles.statNumber}>{followers.length}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => {
              setFollowModalType('following');
              setIsFollowModalVisible(true);
            }}
          >
            <Text style={styles.statNumber}>{following.length}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* Activity Section */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <Ionicons name="create-outline" size={24} color="#6C63FF" />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Started learning React Native</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="trophy-outline" size={24} color="#4CAF50" />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Completed 30 day coding challenge</Text>
                <Text style={styles.activityTime}>2 days ago</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Interests Section */}
        <View style={styles.interestsSection}>
          <View style={styles.interestsHeader}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <TouchableOpacity 
              style={styles.editInterests}
              onPress={() => setIsInterestsModalVisible(true)}
            >
              <Ionicons name="pencil" size={20} color="#6C63FF" />
            </TouchableOpacity>
          </View>
          <View style={styles.interestsGrid}>
            {selectedInterests.map(interest => (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.interestTag,
                  selectedInterests.includes(interest) && styles.selectedInterest
                ]}
                onPress={() => toggleInterest(interest)}
              >
                <Text style={[
                  styles.interestText,
                  selectedInterests.includes(interest) && styles.selectedInterestText
                ]}>
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Posts Grid Section */}
        <View style={styles.postsSection}>
          <View style={styles.postsSectionHeader}>
            <Text style={styles.sectionTitle}>Posts</Text>
            <Text style={styles.postsCount}>{posts.length} posts</Text>
          </View>
          {renderPosts()}
        </View>
      </ScrollView>

      <HamburgerMenu 
        isVisible={isMenuVisible} 
        onClose={() => setIsMenuVisible(false)} 
      />

      <Modal
        visible={isInterestsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsInterestsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Interests</Text>
              <TouchableOpacity 
                onPress={() => setIsInterestsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.interestsList}>
              {AVAILABLE_INTERESTS.map((interest) => (
                <TouchableOpacity
                  key={interest.id}
                  style={[
                    styles.interestOption,
                    selectedInterests.includes(interest.name) && styles.selectedInterest
                  ]}
                  onPress={() => {
                    if (selectedInterests.includes(interest.name)) {
                      handleInterestSelection(interest.name);
                    } else {
                      handleInterestSelection(interest.name);
                    }
                  }}
                >
                  <Ionicons 
                    name={interest.icon as any} 
                    size={24} 
                    color={selectedInterests.includes(interest.name) ? '#fff' : '#6C63FF'} 
                  />
                  <Text style={[
                    styles.interestOptionText,
                    selectedInterests.includes(interest.name) && styles.selectedInterestText
                  ]}>
                    {interest.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isEditBioModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditBioModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Bio</Text>
              <TouchableOpacity 
                onPress={() => setIsEditBioModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.bioInputContainer}>
              <TextInput
                style={styles.bioInput}
                multiline
                maxLength={150}
                placeholder="Write something about yourself..."
                placeholderTextColor="#666"
                value={newBio}
                onChangeText={setNewBio}
              />
              <Text style={styles.bioCharCount}>
                {newBio.length}/150
              </Text>
            </View>

            <View style={styles.bioButtonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setIsEditBioModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleUpdateBio}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FollowModal
        visible={isFollowModalVisible}
        onClose={() => setIsFollowModalVisible(false)}
        title={followModalType === 'followers' ? 'Followers' : 'Following'}
        users={followModalType === 'followers' ? followers : following}
        onFollowPress={handleFollowPress}
        isFollowing={isFollowingUser}
      />

      {renderPostModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    position: 'relative',
    zIndex: 10,
  },
  menuButton: {
    padding: 8,
    alignSelf: 'flex-end',
    position: 'relative',
    zIndex: 10,
  },
  profileContent: {
    alignItems: 'center',
    marginTop: 10,
    position: 'relative',
    zIndex: 10,
  },
  profileSection: {
    position: 'relative',
    padding: 20,
    marginBottom: 16,
    zIndex: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginHorizontal: 30,
    marginTop: 16,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
    position: 'relative',
    zIndex: 3,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1A1A1A',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 20,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  editImageButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#6C63FF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '600',
  },
  username: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(108, 99, 255, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  bio: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'center',
  },
  activitySection: {
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  activityList: {
    gap: 15,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 12,
  },
  activityContent: {
    marginLeft: 15,
    flex: 1,
  },
  activityText: {
    color: '#fff',
    fontSize: 16,
  },
  activityTime: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  interestsSection: {
    padding: 20,
  },
  interestsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  editInterests: {
    padding: 8,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestTag: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  interestText: {
    color: '#fff',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#111',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 1 }],
    ':active': {
      transform: [{ scale: 0.95 }],
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
  },
  modalDetails: {
    padding: 16,
    paddingTop: 8,
  },
  descriptionContainer: {
    marginBottom: 8,
  },
  usernameText: {
    color: '#fff',
    fontWeight: '600',
  },
  descriptionText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postsSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  postsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postsCount: {
    fontSize: 14,
    color: '#666',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
  },
  postContainer: {
    width: POST_WIDTH,
    height: POST_WIDTH,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A2A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestsList: {
    paddingBottom: 20,
  },
  interestOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#2A2A2A',
  },
  selectedInterest: {
    backgroundColor: '#6C63FF',
  },
  interestOptionText: {
    color: '#6C63FF',
    fontSize: 16,
    marginLeft: 15,
  },
  selectedInterestText: {
    color: '#fff',
  },
  editBioButton: {
    marginLeft: 8,
  },
  editBioIcon: {
    marginTop: 2,
  },
  bioInputContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  bioInput: {
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  bioCharCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  bioButtonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#6C63FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  likesCount: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalImageSection: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  floatingCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userTextInfo: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  location: {
    color: '#999',
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 20,
  },
  detailsScroll: {
    maxHeight: 200,
  },
  likesCount: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    color: '#6C63FF',
    fontSize: 14,
  },
  date: {
    color: '#666',
    fontSize: 13,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    zIndex: 1,
  },
  noPostsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noPostsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userImagePlaceholderText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  followButton: {
    backgroundColor: '#6C63FF',
    padding: 8,
    borderRadius: 8,
  },
  followingButton: {
    backgroundColor: '#444',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  followModalContent: {
    width: '100%',
    height: '70%',
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    padding: 0,
  },
  followModalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    position: 'relative',
  },
  followModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  followModalCloseButton: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userList: {
    flex: 1,
  },
  userListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  userListInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userListAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  userListAvatarPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userListAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userListUsername: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  userListFollowButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  userListFollowingButton: {
    backgroundColor: '#333',
  },
  userListFollowButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userListFollowingButtonText: {
    color: '#fff',
  },
}); 
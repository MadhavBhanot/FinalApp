import { View, Text, Modal, Image, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import * as Sharing from 'expo-sharing';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { posts as postsApi, auth } from '@/lib/api';

export default function PostModal({ post, visible, onClose, onLike, onComment, onShare, onPostDeleted }) {
  if (!post) return null;
  const { user } = useUser();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%'], []);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const translateY = useSharedValue(0);
  const [currentUserObjectId, setCurrentUserObjectId] = useState(null);

  // Fetch current user's MongoDB ObjectId
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await auth.getCurrentUser();
        if (response.user?._id) {
          setCurrentUserObjectId(response.user._id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    if (user?.id) {
      fetchCurrentUser();
    }
  }, [user?.id]);

  // Check if current user is the post owner using MongoDB ObjectId
  const isOwner = currentUserObjectId === post.author._id;

  const handleMorePress = () => {
    if (isBottomSheetVisible) return;
    setIsBottomSheetVisible(true);
    bottomSheetRef.current?.expand();
  };

  const handleCloseBottomSheet = () => {
    setIsBottomSheetVisible(false);
    bottomSheetRef.current?.close();
  };

  const ActionItem = ({ icon, label, onPress, destructive = false }) => (
    <TouchableOpacity 
      style={styles.actionItem} 
      onPress={() => {
        onPress();
        handleCloseBottomSheet();
      }}
    >
      <Ionicons name={icon} size={24} color={destructive ? '#ff3b30' : '#fff'} />
      <Text style={[styles.actionLabel, destructive && styles.destructiveText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderActions = () => (
    <BottomSheetView style={styles.bottomSheetContent}>
      <View style={styles.bottomSheetHeader}>
        <View style={styles.bottomSheetIndicator} />
      </View>
      
      <ActionItem icon="share-outline" label="Share Post" onPress={handleShare} />
      <ActionItem icon="bookmark-outline" label="Save Post" onPress={handleSave} />
      
      {isOwner ? (
        // Owner actions
        <>
          <ActionItem icon="create-outline" label="Edit Post" onPress={handleEdit} />
          <ActionItem 
            icon="trash-outline" 
            label="Delete Post" 
            onPress={handleDelete}
            destructive 
          />
        </>
      ) : (
        // Non-owner actions
        <ActionItem 
          icon="alert-circle-outline" 
          label="Report Post" 
          onPress={handleReport}
          destructive 
        />
      )}
    </BottomSheetView>
  );

  const handleShare = async () => {
    try {
      if (post.imageUri.startsWith('data:')) {
        // For base64 images
        const filename = FileSystem.documentDirectory + "temp.jpg";
        const base64Data = post.imageUri.split(',')[1];
        await FileSystem.writeAsStringAsync(filename, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await Sharing.shareAsync(filename);
      } else {
        // For regular URLs
        const localUri = FileSystem.cacheDirectory + 'share.jpg';
        await FileSystem.downloadAsync(post.imageUri, localUri);
        await Sharing.shareAsync(localUri);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSave = () => {
    // Implement save functionality
    console.log('Save post');
  };

  const handleEdit = () => {
    // Implement edit functionality
    console.log('Edit post');
  };

  const handleDelete = async () => {
    try {
      Alert.alert(
        "Delete Post",
        "Are you sure you want to delete this post? This action cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await postsApi.deletePost(post.id);
                handleCloseBottomSheet();
                onClose();
                // Notify parent component to refresh posts
                if (onPostDeleted) {
                  onPostDeleted();
                }
              } catch (error) {
                console.error('Error deleting post:', error);
                Alert.alert('Error', 'Failed to delete post. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in handleDelete:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleReport = () => {
    // Implement report functionality
    console.log('Report post');
  };

  // Simple date formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Gesture handler for modal swipe
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: (event) => {
      if (event.translationY > 100) {
        translateY.value = withSpring(800);
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  // Add debug logs
  console.log('Current user ObjectId:', currentUserObjectId);
  console.log('Post author ID:', post.author._id);
  console.log('Is owner?', isOwner);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.modalContainer}>
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={[styles.modalContent, animatedStyle]}>
              <View style={styles.header}>
                <View style={styles.dragIndicator} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Author Header */}
                <View style={styles.authorHeader}>
                  <Image 
                    source={{ 
                      uri: user?.imageUrl || 'https://via.placeholder.com/40'
                    }}
                    style={styles.authorImage}
                  />
                  <View style={styles.authorInfo}>
                    <Text style={styles.authorName}>
                      {user?.username || 'User'}
                    </Text>
                    {post.location && (
                      <Text style={styles.location}>
                        <Ionicons name="location" size={12} color="#999" /> {post.location}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.moreButton}
                    onPress={handleMorePress}
                  >
                    <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Post Image */}
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: post.imageUri }}
                    style={[styles.image, post.filters ? { filter: post.filters } : {}]}
                  />
                </View>

                {/* Actions Bar */}
                <View style={styles.actions}>
                  <View style={styles.leftActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={onLike}>
                      <Ionicons 
                        name={post.isLiked ? "heart" : "heart-outline"} 
                        size={26} 
                        color={post.isLiked ? "#ff2d55" : "#fff"} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={onComment}>
                      <Ionicons name="chatbubble-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={onShare}>
                      <Ionicons name="paper-plane-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="bookmark-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Post Details */}
                <View style={styles.details}>
                  <Text style={styles.likes}>{post.likes} likes</Text>
                  
                  <View style={styles.captionContainer}>
                    <Image 
                      source={{ uri: user?.imageUrl }} 
                      style={styles.captionAuthorImage} 
                    />
                    <Text style={styles.authorNameCaption}>{user?.username}</Text>
                    <Text style={styles.description}>{post.description}</Text>
                  </View>

                  {post.tags?.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {post.tags.map(tag => (
                        <Text key={tag} style={styles.tag}>#{tag}</Text>
                      ))}
                    </View>
                  )}

                  <Text style={styles.timestamp}>
                    {formatDate(post.createdAt)}
                  </Text>
                </View>
              </ScrollView>
            </Animated.View>
          </PanGestureHandler>

          {isBottomSheetVisible && (
            <BottomSheet
              ref={bottomSheetRef}
              snapPoints={snapPoints}
              enablePanDownToClose
              onClose={handleCloseBottomSheet}
              backgroundStyle={styles.bottomSheetBackground}
              handleIndicatorStyle={styles.bottomSheetIndicator}
            >
              {renderActions()}
            </BottomSheet>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#333',
  },
  authorInfo: {
    flex: 1,
    flexDirection: 'column',
  },
  authorName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  location: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  moreButton: {
    padding: 12,
    marginLeft: 8,
  },
  imageContainer: {
    width: '100%',
    backgroundColor: '#1a1a1a',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  details: {
    padding: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
  },
  likes: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  captionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    alignItems: 'center',
  },
  captionAuthorImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#333',
  },
  authorNameCaption: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 6,
  },
  description: {
    color: '#fff',
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  tag: {
    color: '#6C63FF',
    marginRight: 8,
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  bottomSheetBackground: {
    backgroundColor: '#1a1a1a',
  },
  bottomSheetHeader: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  bottomSheetIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
    marginBottom: 10,
  },
  bottomSheetContent: {
    padding: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  actionLabel: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 16,
  },
  destructiveText: {
    color: '#ff3b30',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
}); 
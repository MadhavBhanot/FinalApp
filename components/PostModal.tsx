import { View, Text, Modal, Image, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, SafeAreaView, StatusBar, Platform, FlatList, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser, useAuth } from '@clerk/clerk-expo';
import * as Sharing from 'expo-sharing';
import BottomSheet, { BottomSheetView, BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { auth } from '@/lib/api/index';
import { deletePost, updatePost, addReply, getReplies } from '@/lib/api/posts';
import api from '@/lib/api/index';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import { Portal } from '@gorhom/portal';

// Update interfaces
interface PostModalProps {
  post: Post;
  visible: boolean;
  onClose: () => void;
  onLike: () => void;
  onComment: (comment: CommentData) => void;
  onShare: () => void;
  onPostDeleted?: () => void;
}

interface ActionItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

const ActionItem = ({ icon, label, onPress, destructive = false }: ActionItemProps) => (
  <TouchableOpacity 
    style={styles.actionItem} 
    onPress={onPress}
  >
    <Ionicons name={icon as any} size={24} color={destructive ? '#ff3b30' : '#fff'} />
    <Text style={[styles.actionLabel, destructive && styles.destructiveText]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Update the Post interface at the top of the file
interface Post {
  _id: string;
  author: string; // MongoDB user ID as string
  content: string;
  image: string;
  location?: string;
  likes: string[]; // Array of MongoDB user IDs
  createdAt: string;
  isLiked?: boolean;
  tags?: string[];
  caption?: string;
}

// Update the fetchMongoUser function to handle the response type
interface MongoUser {
  _id: string;
  username: string;
  profileImg?: string;
  clerkId?: string;
}

const fetchMongoUser = async (authorId: string): Promise<MongoUser | null> => {
  try {
    const response = await api.get(`/users/${authorId}`);
    return response.data?.Data;
  } catch (error) {
    console.error('Error fetching MongoDB user:', error);
    return null;
  }
};

// Update the cached user type
const userCache = new Map<string, {
  username: string;
  imageUrl: string;
}>();

// Add gesture context type
type GestureContext = {
  y: number;
};

// Add new interfaces for comments
interface Comment {
  _id: string;
  author: string;
  content: string;
  createdAt: string;
}

// Add type definitions
interface CommentData {
  _id: string;
  author: {
    _id?: string;
    username: string;
    imageUrl: string;
    profileImg?: string;
  };
  content: string;
  createdAt: string;
  replies?: CommentData[];
  parentComment?: string;
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: Platform.OS === 'android' ? 56 + (StatusBar.currentHeight || 0) : 56,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  closeButton: {
    padding: 8,
    width: 44,
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
  },
  moreButton: {
    padding: 8,
    width: 44,
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#000',
  },
  userInfoSection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
    backgroundColor: '#000',
  },
  userInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorImagePlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorImagePlaceholderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  authorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  location: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 20,
  },
  postDetails: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  likesCount: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  captionContainer: {
    marginVertical: 6,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  captionUsername: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 6,
    letterSpacing: 0.1,
  },
  captionText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
    marginTop: 6,
    letterSpacing: 0.1,
  },
  bottomSheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetBackground: {
    backgroundColor: '#1a1a1a',
  },
  bottomSheetIndicator: {
    backgroundColor: '#666',
    width: 40,
    height: 50,
    borderRadius: 3,
  },
  bottomSheetContent: {
    padding: 16,
    paddingTop: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  actionLabel: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
  destructiveText: {
    color: '#ff3b30',
  },
  editModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingBottom: 40,
    minHeight: 300,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  editModalTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  editModalCancel: {
    color: '#fff',
    fontSize: 16,
  },
  editModalSave: {
    color: '#0095f6',
    fontSize: 16,
    fontWeight: '600',
  },
  editForm: {
    padding: 16,
  },
  editField: {
    marginBottom: 20,
  },
  editLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  editInput: {
    color: '#fff',
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    minHeight: 40,
  },
  likesHeader: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  likesTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  likesList: {
    paddingBottom: 20,
  },
  bottomSheetHeader: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#666',
    borderRadius: 3,
  },
  bottomSheetCloseButton: {
    position: 'absolute',
    right: 16,
    top: 8,
    padding: 4,
  },
  simpleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  simpleTooltip: {
    width: '80%',
    backgroundColor: '#262626',
    borderRadius: 12,
    maxHeight: '90%',
    alignSelf: 'center',
  },
  simpleTooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
    backgroundColor: '#1a1a1a',
  },
  simpleTooltipTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  simpleUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  simpleUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  simpleUserImagePlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleUsername: {
    color: '#fff',
    fontSize: 14,
  },
  simpleMoreText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  commentsContainer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
    position: 'relative',
  },
  commentsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  commentsBottomSheet: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  flashListContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  commentsList: {
    paddingHorizontal: 16,
  },
  commentItemContainer: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
    height: 500,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentUserImagePlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentTextContainer: {
    flex: 1,
  },
  commentUsername: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  commentContent: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  commentTime: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 0.1,
  },
  noCommentsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noCommentsText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  commentInputWrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
    backgroundColor: '#000',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#262626',
    backgroundColor: '#1a1a1a',
  },
  commentInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    padding: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#262626',
    marginRight: 12,
    height: 40,
    letterSpacing: 0.1,
  },
  postCommentText: {
    color: '#0095f6',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.1,
  },
  commentsModal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 16,
    paddingBottom: 0,
  },
  simpleUserContent: {
    flex: 1,
    marginLeft: 12,
  },
  simpleCommentText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  },
  simpleTimeText: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  simpleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
    paddingTop: 12,
    marginTop: 8,
  },
  simpleTextInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    marginRight: 12,
    height: 40,
  },
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cancelReplyButton: {
    marginLeft: 8,
    padding: 4,
  },
  likeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  likeUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  likeUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  likeUserImagePlaceholder: {
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeUsername: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  repliesContainer: {
    marginLeft: 40,
    marginTop: 8,
  },
  replyItem: {
    marginTop: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
  },
  replyButton: {
    marginLeft: 16,
  },
  replyButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 6,
  },
  tag: {
    color: '#0095f6',
    fontSize: 14,
    letterSpacing: 0.1,
  },
  commentsLink: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 0.1,
  },
  overlayClose: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  commentsTooltip: {
    width: '80%',
    height: 500,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1a1a1a',
  },
  tooltipTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  commentsScrollView: {
    flex: 1,
    padding: 16,
    maxHeight: 500,
  },
  replyUserImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});

export default function PostModal({ post, visible, onClose, onLike, onComment, onShare, onPostDeleted }: PostModalProps) {
  if (!post) return null;
  
  const { user } = useUser();
  const { getToken } = useAuth();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '80%'], []);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [authorData, setAuthorData] = useState<{
    username: string;
    imageUrl: string;
  }>(() => {
    // Initialize from cache if available
    const cached = userCache.get(post?.author);
    return cached || {
      username: 'Loading...',
      imageUrl: ''
    };
  });

  // Add animated values for drag gesture
  const translateY = useSharedValue(0);
  const context = useSharedValue<GestureContext>({ y: 0 });

  const gesture = useAnimatedGestureHandler({
    onStart: (_, ctx: GestureContext) => {
      ctx.y = translateY.value;
    },
    onActive: (event, ctx: GestureContext) => {
      translateY.value = ctx.y + event.translationY;
    },
    onEnd: (event) => {
      if (event.velocityY > 500 || translateY.value > 200) {
        translateY.value = withSpring(1000, { velocity: event.velocityY });
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

  // Separate data fetching functions for better control
  const fetchClerkUser = async (clerkId: string) => {
    const response = await api.get(`/clerk/user/${clerkId}`);
    return response.data?.user;
  };

  useEffect(() => {
    const initializeData = async () => {
      if (!visible || !post?.author) return;

      try {
        // Fetch author data
        const cached = userCache.get(post.author);
        if (cached) {
          console.log('📦 Using cached user data');
          setAuthorData(cached);
        } else {
          const mongoUser = await fetchMongoUser(post.author);
          if (!mongoUser) return;

          const initialData = {
            username: mongoUser.username || 'Unknown User',
            imageUrl: mongoUser.profileImg || ''
          };
          setAuthorData(initialData);
          
          if (mongoUser.clerkId) {
            try {
              const clerkUser = await fetchClerkUser(mongoUser.clerkId);
              if (clerkUser?.imageUrl) {
                const finalData = {
                  ...initialData,
                  imageUrl: clerkUser.imageUrl
                };
                setAuthorData(finalData);
                userCache.set(post.author, finalData);
        }
      } catch (error) {
              console.error('Error fetching Clerk data:', error);
              userCache.set(post.author, initialData);
            }
          } else {
            userCache.set(post.author, initialData);
          }
        }

        // Pre-fetch likes data
        await fetchLikesData();
        
        // Check if current user has liked
        const hasLiked = await checkIfLiked();
        setIsLiked(hasLiked);
      } catch (error) {
        console.error('Error in initialization:', error);
      }
    };

    initializeData();
  }, [visible, post?.author]);

  // Add prefetch function for future posts
  const prefetchUserData = useCallback(async (authorId: string) => {
    if (!authorId || userCache.has(authorId)) return;
    
    try {
      const mongoUser = await fetchMongoUser(authorId);
      if (!mongoUser) return;

      const initialData = {
        username: mongoUser.username || 'Unknown User',
        imageUrl: mongoUser.profileImg || ''
      };

      if (mongoUser.clerkId) {
        const clerkUser = await fetchClerkUser(mongoUser.clerkId);
        if (clerkUser?.imageUrl) {
          userCache.set(authorId, {
            ...initialData,
            imageUrl: clerkUser.imageUrl
          });
          return;
        }
      }
      userCache.set(authorId, initialData);
    } catch (error) {
      console.error('Error prefetching user data:', error);
    }
  }, []);

  // Modify the Image component to use progressive loading
  const renderAuthorImage = () => {
    if (!authorData.imageUrl) {
      return (
        <View style={[styles.authorImage, styles.authorImagePlaceholder]}>
          <Ionicons name="person" size={24} color="#fff" />
      </View>
      );
    }

    return (
      <Image 
        source={{ 
          uri: authorData.imageUrl,
          headers: { 'Cache-Control': 'max-age=86400' }
        }}
        style={styles.authorImage}
        onError={() => {
          console.log('Error loading author image');
          setAuthorData(prev => ({
            ...prev,
            imageUrl: ''  // Reset to empty to show icon placeholder
          }));
        }}
        progressiveRenderingEnabled={true}
      />
    );
  };

  // Update the ownership check useEffect
  useEffect(() => {
    const checkOwnership = async () => {
      if (!visible || !user || !post?.author) return;

      try {
        const mongoUserId = await auth.getMongoUserId();
        if (!mongoUserId) {
          console.log('No MongoDB user ID found');
          setIsOwner(false);
          return;
        }

        // Compare MongoDB user IDs
        const ownerCheck = mongoUserId === post.author;
        setIsOwner(ownerCheck);

        console.log('Ownership check:', {
          currentUserId: mongoUserId,
          postAuthorId: post.author,
          isOwner: ownerCheck
        });
    } catch (error) {
        console.error('Error checking ownership:', error);
        setIsOwner(false);
      }
    };

    checkOwnership();
  }, [visible, user, post?.author]);

  const handleMorePress = () => {
    if (isBottomSheetVisible) return;
    console.log('📱 Opening bottom sheet, user is owner:', isOwner);
    setIsBottomSheetVisible(true);
    bottomSheetRef.current?.expand();
  };

  const handleCloseBottomSheet = () => {
    setIsBottomSheetVisible(false);
    bottomSheetRef.current?.close();
  };

  const handleDelete = async () => {
    if (!isOwner) {
      Alert.alert('Error', 'You can only delete your own posts');
      return;
    }

      Alert.alert(
        "Delete Post",
        "Are you sure you want to delete this post? This action cannot be undone.",
        [
        { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
              const mongoUserId = await auth.getMongoUserId();
              
              if (!mongoUserId) {
                Alert.alert('Error', 'You must be logged in to delete posts');
                return;
              }

              // Compare MongoDB user IDs
              if (mongoUserId !== post.author) {
                Alert.alert('Error', 'You can only delete your own posts');
                return;
              }

              const response = await api.delete(`/posts/${post._id}`, {
                data: { userId: mongoUserId }
              });

              if (response.data?.success) {
                handleCloseBottomSheet();
                onClose();
                if (onPostDeleted) {
                  onPostDeleted();
                }
                Alert.alert('Success', 'Post deleted successfully');
              } else {
                throw new Error(response.data?.message || 'Failed to delete post');
              }
            } catch (error: any) {
                console.error('Error deleting post:', error);
              Alert.alert(
                'Error', 
                error.response?.data?.message || 'Failed to delete post. Please try again.'
              );
              }
            },
          },
        ]
      );
  };

  const handleReport = () => {
    Alert.alert('Report', 'Post has been reported');
    handleCloseBottomSheet();
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    content: post.content,
    location: post.location || ''
  });

  const handleEdit = () => {
    setIsEditing(true);
    handleCloseBottomSheet();
  };

  const handleSaveEdit = async () => {
    try {
      const response = await api.patch(`/posts/${post._id}`, {
        content: editData.content,
        location: editData.location
      });

      if (response.data?.success) {
        setIsEditing(false);
        // Update local state
        post.content = editData.content;
        post.location = editData.location;
        Alert.alert('Success', 'Post updated successfully');
      } else {
        throw new Error(response.data?.message || 'Failed to update post');
      }
    } catch (error: any) {
      console.error('Error updating post:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update post. Please try again.'
      );
    }
  };

  const handleShare = async () => {
    try {
      if (post.image.startsWith('data:')) {
        // For base64 images
        const filename = FileSystem.documentDirectory + "temp.jpg";
        const base64Data = post.image.split(',')[1];
        await FileSystem.writeAsStringAsync(filename, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await Sharing.shareAsync(filename);
      } else {
        // For regular URLs
        const localUri = FileSystem.cacheDirectory + 'share.jpg';
        await FileSystem.downloadAsync(post.image, localUri);
        await Sharing.shareAsync(localUri);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
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

  const formatImageUri = (uri: string) => {
    if (!uri) return '';
    
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
    
    // If it's a relative path, construct the full URL
    if (uri.startsWith('/')) {
      return `http://10.0.2.2:5001${uri}`;
    }
    
    return uri;
  };

  const renderBottomSheetHeader = useCallback(() => (
    <View style={styles.bottomSheetHeader}>
      <View style={styles.bottomSheetHandle} />
      <TouchableOpacity 
        style={styles.bottomSheetCloseButton}
        onPress={handleCloseBottomSheet}
      >
        <Ionicons name="close" size={24} color="#666" />
      </TouchableOpacity>
    </View>
  ), []);

  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes.length);

  // Add this function to check if user has liked the post
  const checkIfLiked = async () => {
    try {
      const mongoUserId = await auth.getMongoUserId();
      if (!mongoUserId) return false;
      return post.likes.includes(mongoUserId);
    } catch (error) {
      console.error('Error checking like status:', error);
      return false;
    }
  };

  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likesList, setLikesList] = useState<Array<{
    _id: string;
    username: string;
    imageUrl: string;
  }>>([]);

  // Add this function to fetch likes data
  const fetchLikesData = async () => {
    try {
      const likedUsers = [];
      for (const userId of post.likes) {
        // Check cache first
        const cached = userCache.get(userId);
        if (cached) {
          likedUsers.push({ _id: userId, ...cached });
          continue;
        }

        // Fetch MongoDB user data
        const mongoUser = await fetchMongoUser(userId);
        if (!mongoUser) continue;

        const userData = {
          _id: userId,
          username: mongoUser.username || 'Unknown User',
          imageUrl: mongoUser.profileImg || ''
        };

        // If we have a Clerk ID, fetch that data
        if (mongoUser.clerkId) {
          try {
            const clerkUser = await fetchClerkUser(mongoUser.clerkId);
            if (clerkUser?.imageUrl) {
              userData.imageUrl = clerkUser.imageUrl;
            }
          } catch (error) {
            console.error('Error fetching Clerk data:', error);
          }
        }

        likedUsers.push(userData);
        userCache.set(userId, {
          username: userData.username,
          imageUrl: userData.imageUrl
        });
      }
      setLikesList(likedUsers);
    } catch (error) {
      console.error('Error fetching likes data:', error);
      Alert.alert('Error', 'Failed to load likes list');
    }
  };

  // Add this to render a user item in the likes list
  const LikeItem = ({ user }: { user: { _id: string; username: string; imageUrl: string } }) => (
    <View style={styles.likeItem}>
      <View style={styles.likeUserInfo}>
        {user.imageUrl ? (
          <Image 
            source={{ uri: user.imageUrl }}
            style={styles.likeUserImage}
          />
        ) : (
          <View style={[styles.likeUserImage, styles.likeUserImagePlaceholder]}>
            <Ionicons name="person" size={16} color="#fff" />
          </View>
        )}
        <Text style={styles.likeUsername}>{user.username}</Text>
      </View>
      <TouchableOpacity style={styles.followButton}>
        <Text style={styles.followButtonText}>Follow</Text>
      </TouchableOpacity>
    </View>
  );

  // Add a new ref for likes bottom sheet
  const likesBottomSheetRef = useRef<BottomSheet>(null);

  // Replace the LikesModal component with a LikesBottomSheet
  const LikesBottomSheet = () => (
    <BottomSheet
      ref={likesBottomSheetRef}
      snapPoints={['80%']}
      enablePanDownToClose
      onClose={() => setShowLikesModal(false)}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.bottomSheetIndicator}
      index={-1}
    >
      <View style={styles.likesHeader}>
        <Text style={styles.likesTitle}>Likes</Text>
      </View>
      <BottomSheetFlatList
        data={likesList}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <LikeItem user={item} />}
        contentContainerStyle={styles.likesList}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        showsVerticalScrollIndicator={false}
      />
    </BottomSheet>
  );

  // Add state for tooltip position
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Update the handleLikesPress function to not use position
  const handleLikesPress = () => {
    setTooltipVisible(true);
    fetchLikesData();
  };

  // Replace the LikesTooltip component with a simpler version
  const LikesTooltip = () => {
    if (!tooltipVisible) return null;

    return (
      <View style={styles.simpleOverlay}>
        <View style={styles.simpleTooltip}>
          <View style={styles.simpleTooltipHeader}>
            <Text style={styles.simpleTooltipTitle}>Liked by</Text>
            <TouchableOpacity 
              onPress={() => setTooltipVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {likesList.slice(0, 3).map((user) => (
            <View key={user._id} style={styles.simpleUserItem}>
              {user.imageUrl ? (
                <Image 
                  source={{ uri: user.imageUrl }}
                  style={styles.simpleUserImage}
                />
              ) : (
                <View style={[styles.simpleUserImage, styles.simpleUserImagePlaceholder]}>
                  <Ionicons name="person" size={12} color="#fff" />
                </View>
              )}
              <Text style={styles.simpleUsername}>{user.username}</Text>
            </View>
          ))}
          {likesList.length > 3 && (
            <Text style={styles.simpleMoreText}>
              and {likesList.length - 3} more...
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Add handleLike function
  const handleLike = async () => {
    try {
      const mongoUserId = await auth.getMongoUserId();
      if (!mongoUserId) {
        Alert.alert('Error', 'You must be logged in to like posts');
        return;
      }

      // Optimistically update UI
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

      // Make API call
      const response = await api.post(`/posts/like/${post._id}`);

      if (response.data?.success) {
        // Update post's likes array
        if (newIsLiked) {
          post.likes = [...post.likes, mongoUserId];
      } else {
          post.likes = post.likes.filter(id => id !== mongoUserId);
        }
        
        if (onLike) {
          onLike();
        }
      } else {
        // Revert changes if API call fails
        setIsLiked(!newIsLiked);
        setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1);
        throw new Error(response.data?.message || 'Failed to update like status');
      }
    } catch (error) {
      console.error('Error liking/unliking post:', error);
      Alert.alert('Error', 'Failed to update like status. Please try again.');
    }
  };

  // Add comment state
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Add a helper function to fetch user profile using MongoDB ID
  const fetchUserProfileById = async (mongoUserId: string) => {
    try {
      // First get the user data from MongoDB to get the clerkId
      const mongoUserResponse = await api.get(`/users/${mongoUserId}`);
      console.log('Mongo user response:', mongoUserResponse.data);
      
      if (mongoUserResponse.data?.Data?.clerkId) {
        // Now fetch the Clerk profile using clerkId
        const clerkUserResponse = await api.get(`/clerk/user/${mongoUserResponse.data.Data.clerkId}`);
        console.log('Clerk user response:', clerkUserResponse.data);
        
        return {
          username: mongoUserResponse.data.Data.username,
          imageUrl: clerkUserResponse.data?.user?.imageUrl || ''
        };
      }
      return {
        username: mongoUserResponse.data?.Data?.username || 'Unknown User',
        imageUrl: ''
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Update the fetchComments function
  const fetchComments = async () => {
    try {
      setIsLoadingComments(true);
      const response = await api.get(`/posts/comment/${post._id}`);
      console.log('Raw comments response:', response.data);

      if (response.data?.message === 'Comments Fetched Successfully') {
        const commentsData = response.data.comments || [];
        
        // Process comments and their replies
        const processedComments = commentsData.map((comment: CommentData) => ({
          _id: comment._id,
          content: comment.content,
          createdAt: comment.createdAt,
          author: comment.author,
          parentComment: comment.parentComment,
          replies: (comment.replies || []).map((reply: CommentData) => ({
            _id: reply._id,
            content: reply.content,
            createdAt: reply.createdAt,
            author: reply.author,
            parentComment: reply.parentComment,
            replies: []
          }))
        }));

        console.log('Processed comments:', processedComments);
        // Only show top-level comments (ones without parentComment)
        setComments(processedComments.filter((comment: CommentData) => !comment.parentComment));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Update the handleReply function
  const handleReply = async () => {
    if (!replyingTo || !newComment.trim()) return;

    try {
      console.log('Sending reply:', {
        postId: post._id,
        commentId: replyingTo.commentId,
        content: newComment.trim()
      });

      const response = await api.post(`/posts/comment/${post._id}`, {
        content: newComment.trim(),
        parentComment: replyingTo.commentId
      });

      console.log('Reply response:', response.data);

      if (response.data?.success && response.data?.comment) {
        const newReply = {
          _id: response.data.comment._id,
          content: response.data.comment.content,
          createdAt: response.data.comment.createdAt,
          author: response.data.comment.author,
          parentComment: response.data.comment.parentComment,
          replies: []
        };

        // Update the comments state to add the reply to its parent
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment._id === replyingTo.commentId) {
              // Add reply to direct parent
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply]
              };
            }
            // Check if the reply belongs to a nested reply
            if (comment.replies?.length) {
              return {
                ...comment,
                replies: comment.replies.map(reply => 
                  reply._id === replyingTo.commentId
                    ? { ...reply, replies: [...(reply.replies || []), newReply] }
                  : reply
                )
              };
            }
            return comment;
          })
        );

        // Clear the input and reply state
        setNewComment('');
        setReplyingTo(null);
        commentInputRef.current?.blur();
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      Alert.alert('Error', 'Failed to post reply. Please try again.');
    }
  };

  // Add handleCommentPress function
  const commentInputRef = useRef<TextInput>(null);

  // Add handleCommentPress function
  const handleCommentPress = () => {
    commentInputRef.current?.focus();
    // Scroll to comments section if we have comments
    if (comments.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };

  // Add ref for ScrollView
  const scrollViewRef = useRef<ScrollView>(null);

  // Add useEffect for fetching comments
  useEffect(() => {
    if (visible) {
      fetchComments();
    }
  }, [visible]);

  // Remove bottom sheet related state and refs
  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);

  // Update the handleCommentsPress function
  const handleCommentsPress = useCallback(() => {
    console.log('Comments pressed');
    setIsCommentsModalVisible(true);
    fetchComments();
  }, []);

  // Add useEffect to fetch post data when modal opens
  useEffect(() => {
    if (visible) {
      console.log('Post data:', post); // Debug log
      console.log('Post content:', post.content); // Debug content specifically
      fetchPostData();
    }
  }, [visible]);

  // Update fetchPostData function to properly handle the caption
  const fetchPostData = async () => {
    try {
      const response = await api.get(`/posts/${post._id}`);
      console.log('Full post response:', response.data); // Debug log
      if (response.data?.data) {
        const fetchedPost = response.data.data;
        console.log('Fetched post data:', fetchedPost); // Debug log
        // Update local post data with fetched content
        setPost(prevPost => ({
          ...prevPost,
          content: fetchedPost.caption || '', // Use caption field from DB
        }));
      }
    } catch (error) {
      console.error('Error fetching post data:', error);
    }
  };

  // Add post state
  const [postData, setPost] = useState(post);

  // Add state for reply
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    username: string;
  } | null>(null);

  // Update the renderComment function
  const renderComment = (item: CommentData, level: number = 0) => (
    <View key={item._id} style={[styles.commentItem, level > 0 && styles.replyItem]}>
      <View style={styles.commentUserInfo}>
        {item.author?.imageUrl ? (
          <Image 
            source={{ uri: item.author.imageUrl }}
            style={[styles.commentUserImage, level > 0 && styles.replyUserImage]}
          />
        ) : (
          <View style={[styles.commentUserImage, level > 0 && styles.replyUserImage, styles.commentUserImagePlaceholder]}>
            <Ionicons name="person" size={12} color="#fff" />
          </View>
        )}
        <View style={styles.commentTextContainer}>
          <Text style={styles.commentUsername}>{item.author?.username || 'Unknown'}</Text>
          <Text style={styles.commentContent}>{item.content}</Text>
          <View style={styles.commentActions}>
            <Text style={styles.commentTime}>{formatDate(item.createdAt)}</Text>
            <TouchableOpacity 
              onPress={() => {
                setReplyingTo({
                  commentId: item._id,
                  username: item.author?.username || 'Unknown'
                });
                commentInputRef.current?.focus();
              }}
              style={styles.replyButton}
            >
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Render replies */}
      {item.replies && item.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {item.replies.map(reply => renderComment(reply, level + 1))}
        </View>
      )}
    </View>
  );

  // Update the handlePostComment function
  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await api.post(`/posts/comment/${post._id}`, {
        content: newComment.trim()
      });

      console.log('Comment response:', response.data);

      if (response.data?.success && response.data?.comment) {
        const newCommentData = {
          _id: response.data.comment._id,
          content: response.data.comment.content,
          createdAt: response.data.comment.createdAt,
          author: response.data.comment.author,
          replies: []
        };

        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
        commentInputRef.current?.blur();
        Keyboard.dismiss();

        if (onComment) onComment(newCommentData);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    }
  };

  return (
    <Portal>
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.fullScreenContainer}>
        <StatusBar backgroundColor="black" barStyle="light-content" />
        {/* Fixed Header */}
        <View style={styles.fixedHeader}>
          <TouchableOpacity 
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <TouchableOpacity 
            onPress={handleMorePress}
            style={styles.moreButton}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </TouchableOpacity>
              </View>

        <ScrollView 
          style={styles.content}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* User Info Section */}
          <View style={styles.userInfoSection}>
            <View style={styles.userInfoContent}>
              {renderAuthorImage()}
              <View style={styles.userInfoText}>
                <Text style={styles.authorName}>{authorData.username}</Text>
                    {post.location && (
                      <Text style={styles.location}>
                        <Ionicons name="location" size={12} color="#999" /> {post.location}
                      </Text>
                    )}
                  </View>
            </View>
                </View>

                  <Image 
            source={{ uri: formatImageUri(post.image) }}
            style={styles.postImage}
            resizeMode="cover"
                  />

          <View style={styles.postActions}>
                  <View style={styles.leftActions}>
              <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                      <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isLiked ? "#ff2d55" : "#fff"} 
                      />
                    </TouchableOpacity>
              <TouchableOpacity onPress={handleCommentsPress} style={styles.actionButton}>
                      <Ionicons name="chatbubble-outline" size={24} color="#fff" />
                    </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                      <Ionicons name="paper-plane-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="bookmark-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

          <View style={styles.postDetails}>
            {post.likes && post.likes.length > 0 && (
              <TouchableOpacity onPress={handleLikesPress}>
                <Text style={styles.likesCount}>{post.likes.length} likes</Text>
              </TouchableOpacity>
            )}

            {/* Username and Caption */}
                  <View style={styles.captionContainer}>
              <View style={styles.captionRow}>
                <Text style={styles.captionUsername}>{authorData.username}</Text>
                <Text style={styles.captionText} numberOfLines={3}>
                  {postData.content || post.caption || 'No caption'} {/* Try both content and caption fields */}
                </Text>
              </View>
                  </View>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                {post.tags.map((tag, index) => {
                  // Clean the tag: remove any special characters and spaces
                  const cleanTag = tag.replace(/[^a-zA-Z0-9]/g, '');
                  return (
                    <Text key={index} style={styles.tag}>#{cleanTag}</Text>
                  );
                })}
                    </View>
                  )}

            <TouchableOpacity onPress={handleCommentsPress}>
              <Text style={styles.commentsLink}>
                {comments.length > 0 ? `View all ${comments.length} comments` : 'Add a comment'}
                  </Text>
            </TouchableOpacity>

            <Text style={styles.timestamp}>{formatDate(post.createdAt)}</Text>
                </View>

          {/* Comments Modal */}
          {isCommentsModalVisible && (
            <View style={[styles.simpleOverlay, { zIndex: 1000 }]}>
              <TouchableOpacity 
                style={styles.overlayClose} 
                onPress={() => setIsCommentsModalVisible(false)}
                activeOpacity={1}
              />
              <View style={[styles.simpleTooltip, styles.commentsTooltip]}>
                <View style={styles.tooltipHeader}>
                  <Text style={styles.tooltipTitle}>Comments</Text>
                  <TouchableOpacity 
                    onPress={() => setIsCommentsModalVisible(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.commentsScrollView}
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                >
                  {comments.map((item) => renderComment(item))}

                  {comments.length === 0 && (
                    <View style={styles.noCommentsContainer}>
                      <Text style={styles.noCommentsText}>No comments yet</Text>
                    </View>
                  )}
              </ScrollView>

                <View style={styles.commentInputContainer}>
                  <TextInput
                    ref={commentInputRef}
                    style={styles.commentInput}
                    placeholder={replyingTo 
                      ? `Reply to ${replyingTo.username}...` 
                      : "Add a comment..."}
                    placeholderTextColor="#666"
                    value={newComment}
                    onChangeText={setNewComment}
                    onSubmitEditing={replyingTo ? handleReply : handlePostComment}
                    returnKeyType="send"
                    blurOnSubmit={true}
                  />
                  {newComment.trim() !== '' && (
                    <TouchableOpacity onPress={replyingTo ? handleReply : handlePostComment}>
                      <Text style={styles.postCommentText}>
                        {replyingTo ? 'Reply' : 'Post'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {replyingTo && (
                    <TouchableOpacity 
                      onPress={() => setReplyingTo(null)}
                      style={styles.cancelReplyButton}
                    >
                      <Ionicons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

          {isBottomSheetVisible && (
          <GestureHandlerRootView style={styles.bottomSheetContainer}>
            <BottomSheet
              ref={bottomSheetRef}
              snapPoints={snapPoints}
              enablePanDownToClose
              onClose={handleCloseBottomSheet}
              backgroundStyle={styles.bottomSheetBackground}
              handleIndicatorStyle={styles.bottomSheetIndicator}
              index={0}
            >
              <View style={styles.bottomSheetContent}>
                {isOwner ? (
                  <>
                    <ActionItem 
                      icon="share-outline" 
                      label="Share Post" 
                      onPress={handleShare} 
                    />
                    <ActionItem 
                      icon="create-outline" 
                      label="Edit Post" 
                      onPress={handleEdit} 
                    />
                    <ActionItem 
                      icon="eye-off-outline" 
                      label="Hide Like Count" 
                      onPress={() => {
                        Alert.alert('Coming Soon', 'This feature will be available soon!');
                        handleCloseBottomSheet();
                      }} 
                    />
                    <ActionItem 
                      icon="lock-closed-outline" 
                      label="Turn Off Comments" 
                      onPress={() => {
                        Alert.alert('Coming Soon', 'This feature will be available soon!');
                        handleCloseBottomSheet();
                      }} 
                    />
                    <ActionItem
                      icon="trash-outline"
                      label="Delete Post"
                      onPress={handleDelete}
                      destructive
                    />
                  </>
                ) : (
                  <>
                    <ActionItem 
                      icon="share-outline" 
                      label="Share Post" 
                      onPress={handleShare} 
                    />
                    <ActionItem 
                      icon="bookmark-outline" 
                      label="Save Post" 
                      onPress={() => {
                        Alert.alert('Coming Soon', 'This feature will be available soon!');
                        handleCloseBottomSheet();
                      }} 
                    />
                    <ActionItem 
                      icon="person-remove-outline" 
                      label={`Unfollow @${authorData.username}`}
                      onPress={() => {
                        Alert.alert('Coming Soon', 'This feature will be available soon!');
                        handleCloseBottomSheet();
                      }} 
                    />
                    <ActionItem 
                      icon="volume-mute-outline" 
                      label={`Mute @${authorData.username}`}
                      onPress={() => {
                        Alert.alert('Coming Soon', 'This feature will be available soon!');
                        handleCloseBottomSheet();
                      }} 
                    />
                    <ActionItem
                      icon="alert-circle-outline"
                      label="Report Post"
                      onPress={handleReport}
                      destructive
                    />
                  </>
          )}
        </View>
            </BottomSheet>
      </GestureHandlerRootView>
        )}

        {isEditing && (
          <Modal
            visible={isEditing}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsEditing(false)}
          >
            <View style={styles.editModalContainer}>
              <View style={styles.editModalContent}>
                <View style={styles.editModalHeader}>
                  <TouchableOpacity onPress={() => setIsEditing(false)}>
                    <Text style={styles.editModalCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.editModalTitle}>Edit Info</Text>
                  <TouchableOpacity onPress={handleSaveEdit}>
                    <Text style={styles.editModalSave}>Save</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.editForm}>
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Caption</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editData.content}
                      onChangeText={(text) => setEditData(prev => ({ ...prev, content: text }))}
                      multiline
                      placeholder="Write a caption..."
                      placeholderTextColor="#666"
                    />
                  </View>

                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Location</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editData.location}
                      onChangeText={(text) => setEditData(prev => ({ ...prev, location: text }))}
                      placeholder="Add location..."
                      placeholderTextColor="#666"
                    />
                  </View>
                </View>
              </View>
            </View>
    </Modal>
        )}
      </View>
      {tooltipVisible && <LikesTooltip />}
    </Modal>

    {isCommentsModalVisible && (
      <View style={styles.simpleOverlay}>
        <View style={[styles.simpleTooltip, { maxHeight: '80%' }]}>
          <View style={styles.simpleTooltipHeader}>
            <Text style={styles.simpleTooltipTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setIsCommentsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {comments.map((item) => renderComment(item))}
          
          {comments.length === 0 && (
            <Text style={styles.noCommentsText}>No comments yet</Text>
          )}

          <View style={styles.simpleInputContainer}>
            <TextInput
              ref={commentInputRef}
              style={styles.simpleTextInput}
              placeholder="Add a comment..."
              placeholderTextColor="#666"
              value={newComment}
              onChangeText={setNewComment}
              onSubmitEditing={handlePostComment}
              returnKeyType="send"
              blurOnSubmit={true}
            />
            {newComment.trim() !== '' && (
              <TouchableOpacity onPress={handlePostComment}>
                <Text style={styles.postCommentText}>Post</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    )}
  </Portal>
);
} 
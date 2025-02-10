import api from './index';

export interface Post {
  _id: string;
  image: string;
  content: string;
  createdAt: string;
  likes: string[];
  isLiked: boolean;
  author: {
    _id: string;
    username: string;
    imageUrl: string;
  };
  comments: string[];
  filters?: string;
  tags?: string[];
  location?: string;
}

export interface CreatePostResponse {
  success: boolean;
  post: Post;
}

export interface PostResponse {
  success: boolean;
  post: Post;
}

export interface PostsResponse {
  success: boolean;
  posts: Post[];
}

export interface CreatePostData {
  image: any; // File or base64 string
  caption: string;
  filters?: string;
  tags?: string[];
  location?: string;
}

export interface CommentData {
  _id: string;
  content: string;
  authorId: string;
  createdAt: string;
  replies: CommentData[];
  parentComment?: string;
}

// Add interfaces for replies
export interface ReplyData {
  content: string;
  parentCommentId: string;
}

// Get all posts
export const getAllPosts = async (page: number = 1, limit: number = 10) => {
  try {
    const response = await api.get(`/posts/all?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

// Create a new post
export const createPost = async (formData: FormData) => {
  try {
    const response = await api.post('/posts/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.post;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Get a single post
export const getPostById = async (postId: string) => {
  try {
    const response = await api.get(`/posts/${postId}`);
    return response.data.post;
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
};

// Update a post
export const updatePost = async (postId: string, postData: { content?: string; location?: string }) => {
  try {
    const response = await api.patch(`/posts/update/${postId}`, postData);
    return response.data;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

// Delete a post
export const deletePost = async (postId: string) => {
  try {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Like or unlike a post
export const toggleLike = async (postId: string) => {
  try {
    console.log('🔄 Toggling like for post:', postId);
    const response = await api.post(`/posts/like/${postId}`);
    console.log('✅ Like response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

// Get all likes for a post
export const getPostLikes = async (postId: string): Promise<string[]> => {
  try {
    console.log('🔄 Fetching likes for post:', postId);
    const response = await api.get(`/posts/like/${postId}`);
    console.log('✅ Likes received:', response.data);
    return response.data.likes;
  } catch (error: any) {
    console.error('❌ Error fetching likes:', error.response?.data || error.message);
    throw error;
  }
};

// Save or unsave a post
export const toggleSave = async (postId: string): Promise<{ success: boolean; isSaved: boolean }> => {
  try {
    console.log('🔄 Toggling save for post:', postId);
    const response = await api.post(`/posts/save/${postId}`);
    console.log('✅ Save toggled:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error toggling save:', error.response?.data || error.message);
    throw error;
  }
};

// Get comments for a post
export const getPostComments = async (postId: string): Promise<CommentData[]> => {
  try {
    console.log('🔄 Fetching comments for post:', postId);
    const response = await api.get(`/posts/comment/${postId}`);
    console.log('✅ Comments received:', response.data);
    return response.data.comments;
  } catch (error: any) {
    console.error('❌ Error fetching comments:', error.response?.data || error.message);
    throw error;
  }
};

// Add a comment to a post
export const addComment = async (postId: string, commentData: CommentData): Promise<CommentData> => {
  try {
    console.log('🔄 Adding comment to post:', { postId, commentData });
    const response = await api.post(`/posts/comment/${postId}`, commentData);
    console.log('✅ Comment added:', response.data);
    return response.data.comment;
  } catch (error: any) {
    console.error('❌ Error adding comment:', error.response?.data || error.message);
    throw error;
  }
};

// Get user posts
export const getUserPosts = async (userId: string) => {
  try {
    console.log('🔄 Fetching posts for user:', userId);
    const response = await api.get(`/posts/user/${userId}`);
    
    // If no posts, return empty array
    if (!response.data || !response.data.posts) {
      console.log('ℹ️ No posts found for user');
      return { posts: [] };
    }
    
    console.log('✅ Posts fetched successfully:', response.data.posts.length);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching user posts:', error);
    // Return empty array instead of throwing error
    return { posts: [] };
  }
};

// Helper function to format image URIs (if you don't already have this)
const formatImageUri = (uri: string): string => {
  if (!uri) return '';
  
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  
  if (uri.startsWith('data:image')) {
    return uri;
  }
  
  if (uri.match(/^[A-Za-z0-9+/=]+$/)) {
    return `data:image/jpeg;base64,${uri}`;
  }
  
  if (uri.startsWith('/')) {
    return `http://10.0.2.2:5001${uri}`;
  }
  
  return uri;
};

// Add a reply to a comment
export const addReply = async (postId: string, commentId: string, data: { content: string; parentCommentId: string }) => {
  try {
    console.log('🔄 Adding reply:', { postId, commentId, data });
    const response = await api.post(`/posts/comment/${postId}`, {
      content: data.content,
      parentComment: data.parentCommentId // Send the parent comment ID
    });
    console.log('✅ Reply added:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error adding reply:', error);
    throw error;
  }
};

// Get replies for a comment
export const getReplies = async (commentId: string) => {
  try {
    const response = await api.get(`/comments/${commentId}/replies`);
    return response.data;
  } catch (error) {
    console.error('Error getting replies:', error);
    throw error;
  }
}; 
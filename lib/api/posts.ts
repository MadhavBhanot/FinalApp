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
  content: string;
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
    const response = await api.patch(`/posts/${postId}`, postData);
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
    const response = await api.post(`/posts/like/${postId}`);
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
    const response = await api.get(`/posts/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw error;
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
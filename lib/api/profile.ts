import api from './index';

export interface Post {
  _id: string;
  content: string;
  image?: string;
  author: string;
  likes: string[];
  comments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  _id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  imageUrl?: string;
  followers: string[];
  following: string[];
  posts: Post[];
  savedPosts: string[];
  clerkId: string;
}

// Get user profile with posts
export const getUserProfile = async (userId: string): Promise<Profile> => {
  try {
    console.log('🔄 Fetching user profile:', userId);
    const response = await api.get(`/users/${userId}`);
    console.log('✅ Profile data received:', response.data);
    return response.data.user;
  } catch (error: any) {
    console.error('❌ Error fetching profile:', error.response?.data || error.message);
    throw error;
  }
};

// Get user's posts
export const getUserPosts = async (userId: string): Promise<Post[]> => {
  try {
    console.log('🔄 Fetching user posts:', userId);
    const response = await api.get(`/posts/user/${userId}`);
    console.log('✅ Posts received:', response.data.posts);
    return response.data.posts;
  } catch (error: any) {
    console.error('❌ Error fetching posts:', error.response?.data || error.message);
    throw error;
  }
};

// Update user profile
export const updateProfile = async (userId: string, data: Partial<Profile>): Promise<Profile> => {
  try {
    console.log('🔄 Updating profile:', { userId, data });
    const response = await api.patch(`/users/${userId}`, data);
    console.log('✅ Profile updated:', response.data);
    return response.data.user;
  } catch (error: any) {
    console.error('❌ Error updating profile:', error.response?.data || error.message);
    throw error;
  }
};

// Follow/Unfollow user
export const toggleFollow = async (userId: string): Promise<{ success: boolean; isFollowing: boolean }> => {
  try {
    console.log('🔄 Toggling follow for user:', userId);
    const response = await api.post(`/users/follow/${userId}`);
    console.log('✅ Follow toggled:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error toggling follow:', error.response?.data || error.message);
    throw error;
  }
};

// Get user's followers
export const getFollowers = async (userId: string): Promise<Profile[]> => {
  try {
    console.log('🔄 Fetching followers:', userId);
    const response = await api.get(`/users/followers/${userId}`);
    console.log('✅ Followers received:', response.data);
    return response.data.followers;
  } catch (error: any) {
    console.error('❌ Error fetching followers:', error.response?.data || error.message);
    throw error;
  }
};

// Get user's following
export const getFollowing = async (userId: string): Promise<Profile[]> => {
  try {
    console.log('🔄 Fetching following:', userId);
    const response = await api.get(`/users/following/${userId}`);
    console.log('✅ Following received:', response.data);
    return response.data.following;
  } catch (error: any) {
    console.error('❌ Error fetching following:', error.response?.data || error.message);
    throw error;
  }
};

// Get user's saved posts
export const getSavedPosts = async (userId: string): Promise<Post[]> => {
  try {
    console.log('🔄 Fetching saved posts:', userId);
    const response = await api.get(`/users/${userId}/saved-posts`);
    console.log('✅ Saved posts received:', response.data);
    return response.data.savedPosts;
  } catch (error: any) {
    console.error('❌ Error fetching saved posts:', error.response?.data || error.message);
    throw error;
  }
}; 
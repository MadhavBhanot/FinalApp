import api from './index';

export interface UserProfileData {
  bio?: string;
  location?: string;
  website?: string;
  avatar?: File;
  // Add other profile fields as needed
}

// User profile operations
export const getUserById = async (userId: string) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const updateUserProfile = async (userId: string, profileData: Partial<UserProfileData>) => {
  const response = await api.patch(`/users/${userId}`, profileData);
  return response.data;
};

export const deleteUser = async (userId: string) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

// User social interactions
export const followUser = async (userId: string) => {
  const response = await api.post(`/users/follow/${userId}`);
  return response.data;
};

export const getFollowers = async (userId: string) => {
  const response = await api.get(`/users/followers/${userId}`);
  return response.data;
};

export const getFollowing = async (userId: string) => {
  const response = await api.get(`/users/following/${userId}`);
  return response.data;
}; 
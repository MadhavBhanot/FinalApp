import { createContext, useContext, useState } from 'react';

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

interface PostsContextType {
  posts: Post[];
  addPost: (post: Omit<Post, 'id'>) => void;
  getUserPosts: (userId: string) => Post[];
}

const PostsContext = createContext<PostsContextType | null>(null);

export function PostsProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);

  const addPost = (newPost: Omit<Post, 'id'>) => {
    setPosts(prevPosts => [
      {
        id: Date.now().toString(),
        ...newPost,
      },
      ...prevPosts
    ]);
  };

  const getUserPosts = (userId: string) => {
    return posts.filter(post => post.userId === userId);
  };

  return (
    <PostsContext.Provider value={{ posts, addPost, getUserPosts }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
}
import { createContext, useContext, useState, ReactNode } from 'react';

export interface Post {
  id: string;
  imageUri: string;
  description: string;
  tags: string[];
  likes: number;
  comments: number;
  createdAt: Date;
  userId: string;
}

interface PostsContextType {
  posts: Post[];
  addPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'>) => void;
  getUserPosts: (userId: string) => Post[];
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);

  const addPost = (newPost: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'>) => {
    setPosts(currentPosts => [
      {
        ...newPost,
        id: Date.now().toString(),
        likes: 0,
        comments: 0,
        createdAt: new Date(),
      },
      ...currentPosts,
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
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
} 
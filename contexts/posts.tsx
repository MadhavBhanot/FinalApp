import { createContext, useContext, useState } from 'react';

interface Post {
  id: string;
  imageUri: string;
  description: string;
  location: string;
  tags: string[];
  userId: string;
  username: string;
  userImage: string;
  filters?: string;
  createdAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

interface PostsContextType {
  posts: Post[];
  addPost: (post: Omit<Post, 'id'>) => Promise<void>;
  getUserPosts: (userId: string) => Post[];
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  addComment: (postId: string, comment: string) => Promise<void>;
}

const PostsContext = createContext<PostsContextType | null>(null);

// Add initial posts data
const initialPosts: Post[] = [
  {
    id: '1',
    username: 'williamson',
    userImage: 'https://picsum.photos/200',
    imageUri: 'https://picsum.photos/800',
    description: 'Hey guys! I really love this city pop hit Plastic Love',
    location: '',
    tags: [],
    userId: 'user1',
    createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    likes: 24,
    comments: 3,
    isLiked: false
  },
  {
    id: '2',
    username: 'jane_smith',
    userImage: 'https://picsum.photos/201',
    imageUri: 'https://picsum.photos/801',
    description: 'Beautiful sunset at the beach today! 🌅',
    location: 'Beach Paradise',
    tags: ['sunset', 'beach', 'nature'],
    userId: 'user2',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    likes: 156,
    comments: 12,
    isLiked: true
  },
  // Add more initial posts as needed
];

export function PostsProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);  // Initialize with sample posts

  const addPost = async (newPost: Omit<Post, 'id'>) => {
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

  const likePost = async (postId: string) => {
    // Implementation of likePost
  };

  const unlikePost = async (postId: string) => {
    // Implementation of unlikePost
  };

  const addComment = async (postId: string, comment: string) => {
    // Implementation of addComment
  };

  return (
    <PostsContext.Provider value={{ posts, addPost, getUserPosts, likePost, unlikePost, addComment }}>
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
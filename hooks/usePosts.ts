import { useState, useEffect, useCallback } from 'react';
import { getAllPosts } from '../lib/api/posts';
import { Post } from '../lib/api/profile';

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refreshPosts: () => Promise<void>;
  total: number;
}

export const usePosts = (initialLimit: number = 10): UsePostsReturn => {
  const [posts, setPosts] = useState<Post[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPosts = useCallback(async (pageNum: number, shouldAppend: boolean = true) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAllPosts(pageNum, initialLimit);
      
      setPosts(prev => shouldAppend ? [...prev, ...response.posts] : response.posts);
      setHasMore(response.hasMore);
      setTotal(response.total);
      
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch posts');
      return null;
    } finally {
      setLoading(false);
    }
  }, [initialLimit]);

  // Initial load
  useEffect(() => {
    fetchPosts(1, false);
  }, [fetchPosts]);

  const loadMore = async () => {
    if (!hasMore || loading) return;
    
    const nextPage = page + 1;
    const response = await fetchPosts(nextPage, true);
    
    if (response) {
      setPage(nextPage);
    }
  };

  const refreshPosts = async () => {
    setPage(1);
    await fetchPosts(1, false);
  };

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refreshPosts,
    total,
  };
}; 
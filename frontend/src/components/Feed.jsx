import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CreatePost from './CreatePost';
import PostCard from './PostCard';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/posts');
      
      if (Array.isArray(res.data)) {
        setPosts(res.data);
      } else {
        setPosts([]);
        setError('Received invalid data from server');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 mb-4">
          <i className="fas fa-exclamation-circle text-3xl"></i>
        </div>
        <p className="text-red-500">{error}</p>
        <button 
          onClick={fetchPosts}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  const postsArray = Array.isArray(posts) ? posts : [];

  return (
    <div>
      <CreatePost onPostCreated={handlePostCreated} />
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <i className="fas fa-globe text-indigo-400"></i> Public Feed
        </h2>
        <span className="text-sm font-medium text-slate-500 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-200/60">
          {postsArray.length} post{postsArray.length !== 1 ? 's' : ''}
        </span>
      </div>

      {postsArray.length === 0 ? (
        <div className="text-center py-14 text-slate-400 bg-white/80 backdrop-blur-sm rounded-2xl border border-dashed border-slate-300">
          <i className="fas fa-newspaper text-5xl mb-4 text-slate-300"></i>
          <p className="text-lg font-medium">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {postsArray.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
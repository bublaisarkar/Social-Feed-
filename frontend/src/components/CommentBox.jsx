import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CommentBox = ({ post, onCommentAdded }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(`/posts/${post._id}/comments`, { text: text.trim() });
      const newComment = res.data.comments[res.data.comments.length - 1];
      setText('');
      onCommentAdded(newComment);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add comment');
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="mt-3 flex items-center gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment..."
        className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-slate-50/70"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          } else if (e.key === 'Escape') {
            setText('');
          }
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !text.trim()}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-full transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <i className="fas fa-paper-plane"></i> Post
      </button>
      {text && (
        <button
          onClick={() => setText('')}
          className="text-slate-400 hover:text-slate-600 transition text-sm px-3 py-2"
        >
          Cancel
        </button>
      )}
    </div>
  );
};

export default CommentBox;
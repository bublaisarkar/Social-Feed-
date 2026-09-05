import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();

  const getInitial = (username) => {
    return username ? username.charAt(0).toUpperCase() : '?';
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        e.target.value = '';
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid image (JPEG, PNG, GIF, or WebP)');
        e.target.value = '';
        return;
      }
      
      setImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview('');
    document.getElementById('imageUpload').value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) {
      alert('Please provide text or an image');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    if (content.trim()) formData.append('content', content.trim());
    if (image) formData.append('image', image);

    try {
      const res = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });
      setContent('');
      setImage(null);
      setImagePreview('');
      document.getElementById('imageUpload').value = '';
      setUploadProgress(0);
      onPostCreated(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create post');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 mb-6 transition hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
          {user ? getInitial(user.username) : <i className="fas fa-user text-lg"></i>}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-800">{user?.username || 'Your Name'}</div>
          <div className="text-xs text-slate-400"><i className="far fa-globe"></i> Public</div>
        </div>
      </div>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows="3"
        placeholder="What's on your mind?"
        className="w-full border-0 focus:ring-0 resize-none text-slate-700 placeholder-slate-400 text-lg bg-transparent"
      />
      
      {imagePreview && (
        <div className="mt-3 relative">
          <img src={imagePreview} alt="Preview" className="max-h-64 rounded-xl object-cover w-full bg-slate-100" />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md transition"
          >
            <i className="fas fa-times text-slate-600"></i>
          </button>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/60">
        <div className="flex items-center gap-2">
          <label htmlFor="imageUpload" className="cursor-pointer text-emerald-600 hover:text-emerald-700 transition flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-emerald-50">
            <i className="fas fa-image text-xl"></i>
            <span className="text-sm font-medium">Photo</span>
          </label>
          <input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-full transition flex items-center gap-2 shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-paper-plane"></i> {loading ? `Uploading ${uploadProgress}%` : 'Post'}
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-2">
        <i className="far fa-circle-info"></i> Text or image required (Max 5MB)
      </p>
      {loading && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;
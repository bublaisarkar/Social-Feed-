import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CommentBox from './CommentBox';

const PostCard = ({ post, onPostUpdated, onPostDeleted }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editContent, setEditContent] = useState(post?.content || '');
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(post?.image || '');
  const [likes, setLikes] = useState(post?.likes || []);
  const [comments, setComments] = useState(post?.comments || []);
  const menuRef = useRef(null);
  const { user } = useAuth();

  if (!post) {
    return null;
  }

  const isOwner = user && post.author === user.username;
  const isLiked = user && likes.includes(user.username);

  // Generate unique slug for each post using its unique ID
  const generateSlug = () => {
    // Get the unique post ID
    const postId = post._id || post.id;
    
    // If no ID, generate a random one
    if (!postId) {
      return `post-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }
    
    // Get short ID (first 6 characters of the unique ID)
    const shortId = postId.toString().substring(0, 6);
    
    // Get date
    const date = post.createdAt ? new Date(post.createdAt) : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    return `post-${shortId}-${formattedDate}`;
  };

  const getInitial = (username) => {
    return username ? username.charAt(0).toUpperCase() : '?';
  };

  const getAvatarColor = (username) => {
    const colors = [
      'bg-red-100 text-red-600',
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-yellow-100 text-yellow-600',
      'bg-purple-100 text-purple-600',
      'bg-pink-100 text-pink-600',
      'bg-indigo-100 text-indigo-600',
      'bg-teal-100 text-teal-600',
      'bg-orange-100 text-orange-600',
      'bg-cyan-100 text-cyan-600'
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLike = async () => {
    try {
      const res = await api.put(`/posts/${post._id}/like`);
      setLikes(res.data.likes);
      onPostUpdated(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to like post');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${post._id}`);
      onPostDeleted(post._id);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete post');
    }
    setShowMenu(false);
  };

  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        e.target.value = '';
        return;
      }
      setEditImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveEditImage = () => {
    setEditImage(null);
    setEditImagePreview('');
    document.getElementById('editImageUpload').value = '';
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() && !editImage && !post.image) {
      alert('Post must have text or image');
      return;
    }
    
    const formData = new FormData();
    if (editContent.trim()) formData.append('content', editContent.trim());
    if (editImage) formData.append('image', editImage);

    try {
      const res = await api.put(`/posts/${post._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      onPostUpdated(res.data);
      setIsEditingPost(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to edit post');
    }
    setShowMenu(false);
  };

  const handleShare = () => {
    const slug = generateSlug();
    const shareableLink = `${window.location.origin}/${slug}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareableLink).then(() => {
        alert(`Post link copied to clipboard!\n${shareableLink}`);
      }).catch(() => {
        prompt('Copy this link to share:', shareableLink);
      });
    } else {
      prompt('Copy this link to share:', shareableLink);
    }
    setShowMenu(false);
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await api.delete(`/posts/${post._id}/comments/${commentId}`);
      setComments(res.data.comments);
      onPostUpdated(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete comment');
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment._id);
    setEditCommentText(comment.text);
  };

  const handleSaveCommentEdit = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await api.put(`/posts/${post._id}/comments/${commentId}`, {
        text: editCommentText.trim()
      });
      setComments(res.data.comments);
      onPostUpdated(res.data);
      setEditingComment(null);
      setEditCommentText('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to edit comment');
    }
  };

  const handleCommentAdded = (newComment) => {
    setComments([...comments, newComment]);
    onPostUpdated({ ...post, comments: [...comments, newComment] });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 p-5 transition hover:shadow-md hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${getAvatarColor(post.author)}`}>
          {getInitial(post.author)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800">{post.author}</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <i className="far fa-clock"></i> {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Just now'}
            <span className="mx-1">•</span>
            <i className="fas fa-globe"></i>
            {post._id && (
              <span className="text-xs text-slate-400 ml-1">
                (ID: {post._id.toString().substring(0, 8)})
              </span>
            )}
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100"
          >
            <i className="fas fa-ellipsis-h"></i>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-slate-200/60 py-1 min-w-[180px] z-10">
              {isOwner && (
                <>
                  <button
                    onClick={() => { setIsEditingPost(true); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
                  >
                    <i className="fas fa-pen text-indigo-500"></i> Edit Post
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                  >
                    <i className="fas fa-trash text-red-500"></i> Delete Post
                  </button>
                </>
              )}
              <button
                onClick={handleShare}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
              >
                <i className="fas fa-share-alt text-emerald-500"></i> Share Post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content - Edit Mode */}
      {isEditingPost ? (
        <div className="space-y-3 mb-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows="3"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            placeholder="Edit your post..."
          />
          {editImagePreview && (
            <div className="relative">
              <img src={editImagePreview} alt="Preview" className="max-h-64 rounded-xl object-cover w-full bg-slate-100" />
              <button
                onClick={handleRemoveEditImage}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md transition"
              >
                <i className="fas fa-times text-slate-600"></i>
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <label htmlFor="editImageUpload" className="cursor-pointer text-emerald-600 hover:text-emerald-700 transition flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-emerald-50">
              <i className="fas fa-image"></i>
              <span className="text-sm font-medium">Change Photo</span>
            </label>
            <input id="editImageUpload" type="file" accept="image/*" className="hidden" onChange={handleEditImageUpload} />
            <button
              onClick={handleSaveEdit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-full transition ml-auto"
            >
              Save
            </button>
            <button
              onClick={() => { setIsEditingPost(false); setEditContent(post.content || ''); setEditImagePreview(post.image || ''); setEditImage(null); }}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-4 py-2 rounded-full transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Content */}
          {post.content && (
            <p className="text-slate-700 whitespace-pre-wrap mb-3">{post.content}</p>
          )}

          {/* Image */}
          {post.image && post.image.trim() !== '' && (
            <div className="mb-3 -mx-5">
              <img
                src={post.image}
                alt="Post"
                className="w-full max-h-96 object-cover bg-slate-100"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Actions - Like, Comment, Share */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm font-medium transition px-4 py-1.5 rounded-lg ${
            isLiked ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <i className={`${isLiked ? 'fas' : 'far'} fa-thumbs-up`}></i>
          <span>{likes?.length || 0}</span>
        </button>

        <button
          onClick={() => setShowCommentBox(!showCommentBox)}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:bg-slate-50 transition px-4 py-1.5 rounded-lg"
        >
          <i className="far fa-comment"></i>
          <span>{comments?.length || 0}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:bg-slate-50 transition px-4 py-1.5 rounded-lg"
        >
          <i className="fas fa-share-alt"></i>
          <span>Share</span>
        </button>
      </div>

      {/* Comments */}
      {showCommentBox && user && (
        <CommentBox post={post} onCommentAdded={handleCommentAdded} />
      )}

      {comments && comments.length > 0 && (
        <div className="mt-3 space-y-2">
          {comments.map((comment) => (
            <div key={comment._id} className="flex items-start gap-2 group relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${getAvatarColor(comment.username)}`}>
                {getInitial(comment.username)}
              </div>
              <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2">
                <span className="font-semibold text-sm text-slate-800">{comment.username}</span>
                {editingComment === comment._id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      className="flex-1 border border-indigo-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveCommentEdit(comment._id);
                        } else if (e.key === 'Escape') {
                          setEditingComment(null);
                          setEditCommentText('');
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveCommentEdit(comment._id)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingComment(null);
                        setEditCommentText('');
                      }}
                      className="text-slate-400 hover:text-slate-600 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-slate-700 ml-2">{comment.text}</span>
                )}
              </div>
              {user && comment.username === user.username && editingComment !== comment._id && (
                <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 absolute right-0 top-0">
                  <button
                    onClick={() => handleEditComment(comment)}
                    className="text-slate-400 hover:text-indigo-600 transition p-1 rounded-lg hover:bg-slate-100"
                    title="Edit comment"
                  >
                    <i className="fas fa-pen text-xs"></i>
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="text-slate-400 hover:text-red-600 transition p-1 rounded-lg hover:bg-slate-100"
                    title="Delete comment"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostCard;
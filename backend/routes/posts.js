const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// @route   GET /api/posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/posts
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    let imageUrl = '';

    // If image was uploaded, upload to Cloudinary
    if (req.file) {
      try {
        console.log('Uploading image to Cloudinary...');
        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
        console.log('Image uploaded successfully:', imageUrl);
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        return res.status(500).json({ error: 'Failed to upload image: ' + err.message });
      }
    }

    if (!content && !imageUrl) {
      return res.status(400).json({ error: 'Post must have content or image' });
    }

    const post = new Post({
      author: req.user.username,
      content: content || '',
      image: imageUrl,
      likes: [],
      comments: []
    });

    await post.save();
    console.log('Post created with image:', post.image);
    res.status(201).json(post);
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// @route   PUT /api/posts/:id
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author !== req.user.username) {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }

    const { content } = req.body;
    
    // Update content if provided
    if (content !== undefined) {
      post.content = content;
    }

    // If new image uploaded, update image
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (post.image) {
        await deleteFromCloudinary(post.image);
        console.log('Old image deleted');
      }
      
      try {
        console.log('Uploading new image to Cloudinary...');
        const result = await uploadToCloudinary(req.file.buffer);
        post.image = result.secure_url;
        console.log('New image uploaded:', post.image);
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error('Update post error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// @route   DELETE /api/posts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author !== req.user.username) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    // Delete image from Cloudinary if it exists
    if (post.image) {
      await deleteFromCloudinary(post.image);
      console.log('Image deleted from Cloudinary');
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/posts/:id/like
router.put('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const username = req.user.username;
    const index = post.likes.indexOf(username);

    if (index > -1) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(username);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error('Like post error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/posts/:id/comments
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    post.comments.push({
      username: req.user.username,
      text: text.trim()
    });

    await post.save();
    res.json(post);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/posts/:postId/comments/:commentId
router.put('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.username !== req.user.username) {
      return res.status(403).json({ error: 'Not authorized to edit this comment' });
    }

    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    comment.text = text.trim();
    await post.save();
    res.json(post);
  } catch (err) {
    console.error('Edit comment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/posts/:postId/comments/:commentId
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.username !== req.user.username) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    comment.deleteOne();
    await post.save();
    res.json(post);
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
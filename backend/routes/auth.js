const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register
router.post('/register', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').notEmpty().withMessage('Username is required')
], async (req, res) => {
  try {
    console.log('📝 Registration attempt:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, username } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Create new user
    const user = new User({ email, password, username });
    await user.save();
    console.log('✅ User created:', user._id);

    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('📝 Login attempt:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('✅ User found:', user._id);
    console.log('Password type:', typeof user.password);
    console.log('Has comparePassword method:', typeof user.comparePassword);

    // Check password - with error handling
    try {
      const isMatch = await user.comparePassword(password);
      console.log('Password match:', isMatch);
      
      if (!isMatch) {
        console.log('❌ Password mismatch for:', email);
        return res.status(400).json({ error: 'Invalid credentials' });
      }
    } catch (compareError) {
      console.error('❌ Password comparison error:', compareError);
      return res.status(500).json({ error: 'Error verifying password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful:', user._id);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
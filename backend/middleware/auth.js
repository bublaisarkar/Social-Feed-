const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  console.log('🔑 Auth middleware - Token:', token ? 'Present' : 'Missing');
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log('✅ Token verified for user:', req.user.username);
    next();
  } catch (err) {
    console.error('❌ Token verification error:', err.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};
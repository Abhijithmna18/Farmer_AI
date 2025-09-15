// src/middlewares/auth.middleware.js
// Supports Firebase ID tokens (default flow) and JWT (backend login/admin)
const { verifyIdToken } = require('../config/firebase');
const { verifyToken } = require('../services/token.service');
const User = require('../models/User');

/**
 * Middleware to authenticate requests.
 * - First tries Firebase ID token verification
 * - If that fails, falls back to verifying our own JWT
 * Attaches full User document (sans password) to req.user
 */
const authenticateToken = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('Request URL:', req.originalUrl);
    console.log('Request method:', req.method);
    
    const authHeader = req.headers.authorization;
    console.log('Authorization header present:', !!authHeader);
    console.log('Authorization header value:', authHeader ? `${authHeader.substring(0, 20)}...` : 'null');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ AUTH ERROR: No valid authorization header');
      console.log('Expected format: "Bearer <token>"');
      console.log('Received:', authHeader || 'null');
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Missing or invalid Authorization header. Expected format: "Bearer <token>"'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('Extracted token length:', token ? token.length : 0);
    console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'null');

    // Try Firebase ID token first
    try {
      console.log('🔐 Attempting Firebase ID token verification...');
      const decodedFirebase = await verifyIdToken(token);
      console.log('✅ Firebase token verified successfully');
      console.log('Firebase user email:', decodedFirebase.email);
      console.log('Firebase user verified:', decodedFirebase.email_verified);
      
      let user = await User.findOne({ email: decodedFirebase.email }).select('-password');
      if (!user) {
        console.log('🆕 Creating new user from Firebase token');
        // Create minimal user if coming from Firebase first-time
        user = new User({
          name: decodedFirebase.name || decodedFirebase.email.split('@')[0],
          email: decodedFirebase.email,
          verified: !!decodedFirebase.email_verified,
          roles: ['farmer'],
        });
        await user.save();
        console.log('✅ New user created:', user._id);
      } else {
        console.log('✅ Existing user found:', user._id);
      }
      req.user = user;
      console.log('=== AUTH MIDDLEWARE SUCCESS (Firebase) ===');
      return next();
    } catch (firebaseErr) {
      console.log('⚠️ Firebase token verification failed:', firebaseErr.message);
      console.log('🔄 Falling back to JWT verification...');
      
      // Fall back to JWT
      try {
        const decoded = verifyToken(token); // { id, email, roles }
        console.log('✅ JWT token verified successfully');
        console.log('JWT user ID:', decoded.id);
        console.log('JWT user email:', decoded.email);
        
        // Special case for admin user with id 'admin'
        if (decoded.id === 'admin') {
          req.user = { _id: 'admin', email: decoded.email, role: 'admin', roles: ['admin'] };
          console.log('=== AUTH MIDDLEWARE SUCCESS (JWT) - Admin user ===');
          return next();
        }

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          console.error('❌ JWT AUTH ERROR: User not found in database');
          return res.status(401).json({ 
            message: 'Invalid token user',
            error: 'User associated with token not found in database'
          });
        }
        console.log('✅ JWT user found:', user._id);
        // Ensure both id and _id are available for compatibility
        req.user = user;
        req.user.id = user._id; // Add id field for compatibility
        console.log('=== AUTH MIDDLEWARE SUCCESS (JWT) ===');
        return next();
      } catch (jwtErr) {
        console.error('❌ JWT AUTH ERROR:', jwtErr.message);
        return res.status(401).json({
          message: 'Authentication failed',
          error: 'Token verification failed for both Firebase and JWT methods'
        });
      }
    }
  } catch (err) {
    console.error('=== AUTH MIDDLEWARE CRITICAL ERROR ===');
    console.error('Unexpected error in auth middleware:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ 
      message: 'Server error',
      error: 'Internal authentication error'
    });
  }
};

/**
 * Middleware to require specific roles
 * @param {Array} allowedRoles - Array of allowed roles
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'User not authenticated'
      });
    }

    const userRoles = req.user.roles || [req.user.role].filter(Boolean);
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        message: 'Access denied',
        error: `Required roles: ${allowedRoles.join(', ')}. User roles: ${userRoles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = { authenticateToken, requireRole };

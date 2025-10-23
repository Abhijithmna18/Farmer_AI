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
    // More detailed logging for debugging
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // More specific error message for different scenarios
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'Missing Authorization header. Please log in to access this resource.'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid authorization format',
          error: 'Authorization header must start with "Bearer ". Expected format: "Bearer <token>"'
        });
      }
    }

    const token = authHeader.split(' ')[1];

    // Try Firebase ID token first
    try {
      const decodedFirebase = await verifyIdToken(token);
      
      let user = await User.findOne({ email: decodedFirebase.email }).select('-password');
      if (!user) {
        // Create minimal user if coming from Firebase first-time
        user = new User({
          name: decodedFirebase.name || decodedFirebase.email.split('@')[0],
          email: decodedFirebase.email,
          verified: !!decodedFirebase.email_verified,
          roles: ['farmer'],
        });
        await user.save();
      }
      req.user = user;
      // Ensure both id and _id are present for downstream controllers
      req.user.id = user._id;
      return next();
    } catch (firebaseErr) {
      // Fall back to JWT
      try {
        const decoded = verifyToken(token); // { id, email, roles }

        // Special case for admin user with id 'admin' -> ensure real DB user exists
        if (decoded.id === 'admin') {
          try {
            let adminUser = await User.findOne({ email: decoded.email }).select('-password');
            if (!adminUser) {
              adminUser = new User({
                firstName: 'Admin',
                lastName: 'User',
                name: 'Admin User',
                email: decoded.email,
                verified: true,
                roles: ['admin'],
                role: 'admin',
                userType: 'farmer',
              });
              await adminUser.save();
            } else if (!adminUser.roles.includes('admin')) {
              adminUser.roles = Array.from(new Set([...(adminUser.roles || []), 'admin']));
              adminUser.role = adminUser.role || 'admin';
              await adminUser.save();
            }
            req.user = adminUser;
            req.user.id = adminUser._id;
            return next();
          } catch (adminSetupErr) {
            return res.status(500).json({ 
              success: false,
              message: 'Failed to initialize admin user',
              error: adminSetupErr.message
            });
          }
        }

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          return res.status(401).json({ 
            success: false,
            message: 'Invalid token user',
            error: 'User associated with token not found in database'
          });
        }
        // Ensure both id and _id are available for compatibility
        req.user = user;
        req.user.id = user._id; // Add id field for compatibility
        return next();
      } catch (jwtErr) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed',
          error: 'Token verification failed. Please log in again.',
          details: process.env.NODE_ENV === 'development' ? jwtErr.message : undefined
        });
      }
    }
  } catch (err) {
    return res.status(500).json({ 
      success: false,
      message: 'Server error during authentication',
      error: 'Internal authentication error occurred'
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
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated. Please log in.'
      });
    }

    const userRoles = req.user.roles || [req.user.role].filter(Boolean);
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: `Required roles: ${allowedRoles.join(', ')}. User roles: ${userRoles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = { authenticateToken, requireRole };
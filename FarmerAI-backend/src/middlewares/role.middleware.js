const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authorizeRoles = (roles) => {
  return async (req, res, next) => {
    // Assuming JWT middleware attached full user document to req.user
    if (!req.user || (!req.user.id && !req.user._id)) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    try {
      const user = req.user._id ? req.user : await User.findById(req.user.id).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found.' });

      const userRolesArray = Array.isArray(user.roles) ? user.roles : [];
      const userSingleRole = user.role;
      const hasRequiredRole = roles.some(role => userRolesArray.includes(role) || userSingleRole === role);

      if (!hasRequiredRole) {
        return res.status(403).json({ message: 'Access denied. Insufficient role.' });
      }

      next();
    } catch (error) {
      console.error('Error in role authorization middleware:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };
};

module.exports = authorizeRoles;

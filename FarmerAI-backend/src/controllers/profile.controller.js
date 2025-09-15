const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken } = require('../middlewares/auth.middleware');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profile-pictures');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
    }
  }
});

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -googleId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Convert profile picture path to URL if it exists
    let profilePictureUrl = null;
    if (user.photoURL) {
      if (user.photoURL.startsWith('http')) {
        // External URL (Google profile picture)
        profilePictureUrl = user.photoURL;
      } else {
        // Local file path
        profilePictureUrl = `/uploads/profile-pictures/${path.basename(user.photoURL)}`;
      }
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        state: user.state,
        district: user.district,
        pincode: user.pincode,
        soilType: user.soilType,
        crops: user.crops,
        language: user.language,
        photoURL: profilePictureUrl,
        preferences: user.preferences,
        notificationPreferences: user.notificationPreferences,
        emailVerified: user.emailVerified,
        verified: user.verified,
        roles: user.roles,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      location,
      state,
      district,
      pincode,
      soilType,
      crops,
      language,
      preferences
    } = req.body;

    const updateData = {};
    
    // Validate and update fields
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (state !== undefined) updateData.state = state.trim();
    if (district !== undefined) updateData.district = district.trim();
    if (pincode !== undefined) updateData.pincode = pincode.trim();
    if (soilType !== undefined) updateData.soilType = soilType.trim();
    if (crops !== undefined) updateData.crops = Array.isArray(crops) ? crops : [];
    if (language !== undefined) updateData.language = language.trim();
    
    // Update preferences if provided
    if (preferences) {
      updateData.preferences = {
        ...req.user.preferences,
        ...preferences
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -googleId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Convert profile picture path to URL if it exists
    let profilePictureUrl = null;
    if (user.photoURL) {
      if (user.photoURL.startsWith('http')) {
        profilePictureUrl = user.photoURL;
      } else {
        profilePictureUrl = `/uploads/profile-pictures/${path.basename(user.photoURL)}`;
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        state: user.state,
        district: user.district,
        pincode: user.pincode,
        soilType: user.soilType,
        crops: user.crops,
        language: user.language,
        photoURL: profilePictureUrl,
        preferences: user.preferences,
        notificationPreferences: user.notificationPreferences,
        emailVerified: user.emailVerified,
        verified: user.verified,
        roles: user.roles,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Become warehouse owner (self-service role upgrade)
exports.becomeWarehouseOwner = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If already a warehouse owner, no-op
    const roles = Array.isArray(user.roles) ? new Set(user.roles) : new Set();
    roles.add('warehouse-owner');

    user.roles = Array.from(roles);
    user.role = 'warehouse-owner';
    user.userType = 'warehouse-owner';

    // Initialize warehouseOwnerProfile if not present
    if (!user.warehouseOwnerProfile) {
      user.warehouseOwnerProfile = {
        verificationStatus: 'pending',
        isActive: true
      };
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Upgraded to warehouse owner successfully',
      user: {
        id: user._id,
        email: user.email,
        roles: user.roles,
        role: user.role,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error('becomeWarehouseOwner error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upgrade role' });
  }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile picture if it exists and is a local file
    if (user.photoURL && !user.photoURL.startsWith('http')) {
      try {
        const oldFilePath = path.join(__dirname, '../../uploads/profile-pictures', path.basename(user.photoURL));
        await fs.unlink(oldFilePath);
      } catch (error) {
        console.log('Old profile picture not found or already deleted');
      }
    }

    // Update user with new profile picture path
    const newPhotoURL = req.file.path;
    user.photoURL = newPhotoURL;
    await user.save();

    const profilePictureUrl = `/uploads/profile-pictures/${path.basename(newPhotoURL)}`;

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      photoURL: profilePictureUrl
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove profile picture
exports.removeProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete profile picture file if it exists and is a local file
    if (user.photoURL && !user.photoURL.startsWith('http')) {
      try {
        const filePath = path.join(__dirname, '../../uploads/profile-pictures', path.basename(user.photoURL));
        await fs.unlink(filePath);
      } catch (error) {
        console.log('Profile picture file not found or already deleted');
      }
    }

    // Remove photoURL from user document
    user.photoURL = null;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture removed successfully'
    });
  } catch (error) {
    console.error('Error removing profile picture:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update email with verification
exports.updateEmail = async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !currentPassword) {
      return res.status(400).json({ message: 'New email and current password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Check if email is already in use
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== req.user.id) {
      return res.status(400).json({ message: 'Email is already in use' });
    }

    // Update email and mark as unverified
    user.email = newEmail;
    user.emailVerified = false;
    await user.save();

    // TODO: Send verification email to new email address
    // This would typically involve sending a verification link

    res.json({
      success: true,
      message: 'Email updated successfully. Please verify your new email address.',
      emailVerified: false
    });
  } catch (error) {
    console.error('Error updating email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Export multer upload middleware
exports.upload = upload;









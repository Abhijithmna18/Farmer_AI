const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../services/email.service');
const logger = require('../utils/logger');

// Get user preferences
exports.getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('preferences');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      preferences: user.preferences || {
        language: 'en',
        theme: 'light',
        timezone: 'UTC',
        temperatureUnit: 'celsius',
        measurementUnit: 'metric'
      }
    });
  } catch (error) {
    logger.error('Error fetching preferences:', error);
    next(error);
  }
};

// Update user preferences
exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { language, theme, timezone, temperatureUnit, measurementUnit } = req.body;

    const updateData = {};
    if (language) updateData['preferences.language'] = language;
    if (theme) updateData['preferences.theme'] = theme;
    if (timezone) updateData['preferences.timezone'] = timezone;
    if (temperatureUnit) updateData['preferences.temperatureUnit'] = temperatureUnit;
    if (measurementUnit) updateData['preferences.measurementUnit'] = measurementUnit;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, select: 'preferences' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    logger.error('Error updating preferences:', error);
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has a password (Firebase users might not have one)
    if (!user.password) {
      logger.warn(`User ${userId} (${user.email}) attempted to change password but has no password set (likely Firebase user)`);
      return res.status(400).json({ 
        message: 'Cannot change password: No password set. This account may have been created with social login.' 
      });
    }

    // Verify current password
    try {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
    } catch (bcryptError) {
      logger.error('Error comparing password:', bcryptError);
      return res.status(500).json({ message: 'Error verifying current password' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Error changing password:', error);
    next(error);
  }
};

// Get login history
exports.getLoginHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('loginHistory');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      loginHistory: user.loginHistory || []
    });
  } catch (error) {
    logger.error('Error fetching login history:', error);
    next(error);
  }
};

// Add login entry
exports.addLoginEntry = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { device, location, ip } = req.body;

    const loginEntry = {
      device: device || 'Unknown Device',
      location: location || 'Unknown Location',
      ip: ip || 'Unknown IP',
      timestamp: new Date()
    };

    await User.findByIdAndUpdate(
      userId,
      { 
        $push: { 
          loginHistory: { 
            $each: [loginEntry], 
            $slice: -10 // Keep only last 10 entries
          } 
        } 
      }
    );

    res.json({
      success: true,
      message: 'Login entry added successfully'
    });
  } catch (error) {
    logger.error('Error adding login entry:', error);
    next(error);
  }
};

// Get notification preferences
exports.getNotificationPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('notificationPreferences');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      notifications: user.notificationPreferences || {
        email: {
          weather: true,
          soil: true,
          growth: true,
          reports: false
        },
        sms: {
          weather: false,
          soil: false,
          growth: true,
          reports: false
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    next(error);
  }
};

// Update notification preferences
exports.updateNotificationPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { email, sms } = req.body;

    const updateData = {};
    if (email) updateData['notificationPreferences.email'] = email;
    if (sms) updateData['notificationPreferences.sms'] = sms;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, select: 'notificationPreferences' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      notifications: user.notificationPreferences
    });
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    next(error);
  }
};

// Send test notification
exports.sendTestNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, method } = req.body; // type: 'weather', 'soil', 'growth', 'reports'; method: 'email', 'sms'

    if (!type || !method) {
      return res.status(400).json({ message: 'Type and method are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const testMessage = `This is a test ${type} notification from FarmerAI. Your notification settings are working correctly!`;

    if (method === 'email') {
      await sendEmail({
        to: user.email,
        subject: `Test ${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
        text: testMessage,
        html: `<p>${testMessage}</p>`
      });
    } else if (method === 'sms') {
      // TODO: Implement SMS service
      logger.info(`SMS notification would be sent: ${testMessage}`);
    }

    res.json({
      success: true,
      message: `Test ${method.toUpperCase()} notification sent successfully`
    });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    next(error);
  }
};

// Update profile
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email && email !== req.user.email) {
      updateData.email = email;
      updateData.emailVerified = false; // Reset verification status
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, select: 'name email emailVerified' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send verification email if email was changed
    if (email && email !== req.user.email) {
      try {
        await sendEmail({
          to: email,
          subject: 'Verify Your New Email Address',
          text: 'Please verify your new email address by clicking the link in this email.',
          html: `
            <h2>Email Verification Required</h2>
            <p>Please verify your new email address by clicking the button below:</p>
            <a href="${process.env.FRONTEND_URL}/verify-email?token=VERIFICATION_TOKEN" 
               style="background: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Verify Email
            </a>
          `
        });
      } catch (emailError) {
        logger.error('Error sending verification email:', emailError);
        // Don't fail the request if email sending fails
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    logger.error('Error updating profile:', error);
    next(error);
  }
};

// Delete account
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    logger.info(`Delete account request from user: ${userId}`);

    if (!password) {
      logger.warn(`Delete account failed: No password provided for user ${userId}`);
      return res.status(400).json({ message: 'Password is required to delete account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.error(`Delete account failed: User not found - ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    logger.info(`Delete account: Found user ${userId} (${user.email})`);

    // Check if user has a password (Firebase users might not have one)
    if (!user.password) {
      logger.warn(`User ${userId} (${user.email}) attempted to delete account but has no password set (likely Firebase user)`);
      return res.status(400).json({ 
        message: 'Cannot delete account: No password set. This account may have been created with social login.' 
      });
    }

    // Verify password
    try {
      logger.info(`Verifying password for user ${userId}`);
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        logger.warn(`Delete account failed: Incorrect password for user ${userId}`);
        return res.status(400).json({ message: 'Incorrect password' });
      }
      logger.info(`Password verified successfully for user ${userId}`);
    } catch (bcryptError) {
      logger.error('Error comparing password:', bcryptError);
      return res.status(500).json({ message: 'Error verifying password' });
    }

    // Delete user account
    await User.findByIdAndDelete(userId);
    logger.info(`User account deleted successfully: ${userId} (${user.email})`);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting account:', error);
    next(error);
  }
};


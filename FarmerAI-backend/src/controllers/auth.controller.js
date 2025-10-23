// src/controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const User = require('../models/User');
const { sendWelcomeEmail, sendThankYouEmail, sendEmail } = require('../services/email.service');
const { generateOTP, sendOTPEmail, isOTPValid, clearOTP } = require('../services/otp.service');
const {
  generateEmailVerificationLink,
  generatePasswordResetLink,
  verifyIdToken,
} = require('../config/firebase');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;


// helper: sign JWT
function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// helper: generate numeric OTP (6 digits)
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// helper: hash OTP before storing
function hashOtp(otp) {
  // use a one-way hash for OTP stored on server
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Register a new user
 * Expects: { name? | firstName, lastName, email, password?, confirmPassword?, role? }
 */
exports.register = async (req, res, next) => {
  try {
    const { name, firstName: fn, lastName: ln, email, password, confirmPassword, role } = req.body;

    // Split name if provided
    let firstName = fn;
    let lastName = ln;
    if (name && (!firstName || !lastName)) {
      const parts = String(name).trim().split(/\s+/);
      firstName = firstName || parts[0];
      lastName = lastName || parts.slice(1).join(' ') || 'User';
    }

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, message: 'First name, last name and email are required.' });
    }
    if (password && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and confirm password do not match.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }

    let hashed;
    if (password) {
      hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    }

    // Generate OTP for email verification
    const otpCode = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Validate/map role
    const roleMap = {
      user: 'farmer',
      owner: 'warehouse-owner',
      farmer: 'farmer',
      'warehouse-owner': 'warehouse-owner',
      admin: 'farmer', // do not allow setting admin during signup
    };
    const mappedRole = role ? roleMap[role] : 'farmer';
    const validRoles = ['farmer', 'warehouse-owner'];
    const userRole = validRoles.includes(mappedRole) ? mappedRole : 'farmer';
    
    const user = new User({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email,
      password: hashed,
      verified: false,
      isVerified: false,
      verificationCode: otpCode,
      verificationCodeExpires: otpExpires,
      roles: [userRole],
      role: userRole,
      userType: userRole,
    });

    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail(email, firstName, lastName, otpCode);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Don't fail registration if email fails, but log the error
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification code.',
      email: user.email,
      requiresVerification: true
    });
  } catch (err) {
    console.error('register error', err);
    return next(err);
  }
};

/**
 * Login
 * Expects: { email, password }
 */
exports.login = async (req, res, next) => {
  try {
    console.log('=== LOGIN DEBUG ===');
    console.log('Request body:', req.body);
    const { email, password } = req.body;
    console.log('Email:', email);
    console.log('Password provided:', !!password);

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Email and password required.' });
    }

    // Admin override (hardcoded credentials)
    const ADMIN_EMAIL = 'abhijithmnair2002@gmail.com';
    const ADMIN_PASSWORD = 'Admin@123';
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log('Admin override login');
      const token = signJwt({ id: 'admin', email: ADMIN_EMAIL, role: 'admin' });
      return res.json({ success: true, token, user: { id: 'admin', email: ADMIN_EMAIL, role: 'admin' } });
    }

    console.log('Looking for user with email:', email);
    const user = await User.findOne({ email });
    console.log('User found:', !!user);

    // If user not found or no local password, return generic 401
    if (!user || !user.password) {
      console.log('User not found or no local password set');
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      console.log('User not verified');
      return res.status(401).json({ 
        success: false, 
        message: 'Please verify your email before logging in. Check your email for verification code.',
        requiresVerification: true,
        email: user.email
      });
    }

    console.log('Comparing passwords...');
    const match = await bcrypt.compare(password, user.password);
    console.log('Password match:', match);

    if (!match) {
      console.log('Password does not match');
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    console.log('Creating JWT token...');
    const token = signJwt({ id: user._id, email: user.email, role: user.role || 'farmer', firstName: user.firstName, lastName: user.lastName });
    console.log('Token created successfully');

    console.log('=== LOGIN SUCCESS ===');
    return res.json({ success: true, token, user: { id: user._id, email: user.email, role: user.role || 'farmer', firstName: user.firstName, lastName: user.lastName } });
  } catch (err) {
    console.error('login error', err);
    return next(err);
  }
};

/**
 * Send Email Verification Link (server-side generation via Firebase Admin)
 * Expects: { email } OR uses logged-in user's email (from req.user or token)
 * Returns: generated link (frontend can email it or open a client flow)
 */
exports.sendEmailVerification = async (req, res, next) => {
  try {
    const email = req.body.email || (req.user && req.user.email);
    if (!email) return res.status(400).json({ message: 'Email required.' });

    const link = await generateEmailVerificationLink(email);
    // NOTE: Admin SDK only generates link. You must send it to user via email provider or return it to client.
    return res.json({ message: 'Email verification link generated.', link });
  } catch (err) {
    console.error('sendEmailVerification error', err);
    return next(err);
  }
};

/**
 * Verify email using Firebase ID Token provided by client
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'idToken is required.' });

    // verify firebase token and extract email
    let decoded;
    try {
      decoded = await verifyIdToken(idToken);
    } catch (err) {
      console.error('Firebase token verify failed', err);
      return res.status(401).json({ message: 'Invalid Firebase ID token.' });
    }

    const email = decoded.email;
    if (!email) return res.status(400).json({ message: 'Firebase token did not contain email.' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found for that email.' });
    }

    user.verified = true;
    await user.save();

    return res.json({ message: 'Email verified successfully.' });
  } catch (err) {
    console.error('verifyEmail error', err);
    return next(err);
  }
};

/**
 * Send OTP (server-generated)
 */
exports.sendOtp = async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    if (!email && !phone) return res.status(400).json({ message: 'Provide email or phone to send OTP.' });

    const query = email ? { email } : { phone };

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.otpHash = otpHash;
    user.otpExpiresAt = expiresAt;
    await user.save();

    return res.json({
      message: 'OTP generated and stored. Send it to the user via SMS or email provider.',
      devOtp: otp, // remove this in production
      expiresAt,
    });
  } catch (err) {
    console.error('sendOtp error', err);
    return next(err);
  }
};

/**
 * Verify OTP
 */
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, phone, otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'OTP required.' });
    if (!email && !phone) return res.status(400).json({ message: 'Provide email or phone to verify OTP.' });

    const query = email ? { email } : { phone };
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (!user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ message: 'No OTP found for this user. Request a new one.' });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({ message: 'OTP expired. Request a new one.' });
    }

    const otpHash = hashOtp(otp);
    if (otpHash !== user.otpHash) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // success — clear OTP and optionally mark phone/email verified
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;

    if (phone) user.phoneVerified = true;
    if (email) user.verified = true;

    await user.save();

    return res.json({ message: 'OTP verified.' });
  } catch (err) {
    console.error('verifyOtp error', err);
    return next(err);
  }
};

/**
 * Forgot Password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required.' });

    // confirm user exists (optional)
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No user found with that email.' });

    const link = await generatePasswordResetLink(email);

    return res.json({ message: 'Password reset link generated.', link });
  } catch (err) {
    console.error('forgotPassword error', err);
    return next(err);
  }
};

/**
 * Get user profile (requires authentication)
 */
exports.getProfile = async (req, res, next) => {
  try {
    console.log('getProfile called');
    const userFromToken = req.user;
    
    if (!userFromToken) {
      console.error('No user attached to request in getProfile');
      return res.status(401).json({ message: 'Authentication error: no user found.' });
    }

    // Handle special admin case (hardcoded admin with id='admin')
    if (userFromToken._id === 'admin' || userFromToken.id === 'admin') {
      return res.json({ 
        success: true,
        user: { 
          id: 'admin',
          _id: 'admin',
          email: userFromToken.email || 'abhijithmnair2002@gmail.com',
          role: 'admin',
          roles: ['admin'],
          userType: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          name: 'Admin User',
          photoURL: null
        } 
      });
    }

    // Always fetch the latest full user document to include fields like photoURL
    const user = await User.findById(userFromToken._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Migration logic: if user has name but no firstName/lastName, split it
    if (user.name && (!user.firstName || !user.lastName)) {
      const nameParts = user.name.trim().split(' ');
      user.firstName = nameParts[0] || 'User';
      user.lastName = nameParts.slice(1).join(' ') || 'Name';
      
      // Update the user in database
      await User.findByIdAndUpdate(user._id, {
        firstName: user.firstName,
        lastName: user.lastName
      });
    }

    // Derive a stable primary role prioritizing admin, then explicit role, then roles array, then userType
    const derivedRole = (Array.isArray(user.roles) && user.roles.includes('admin'))
      ? 'admin'
      : (user.role || (Array.isArray(user.roles) && user.roles[0]) || user.userType || 'farmer');

    // Normalize photoURL: if it's a local file path, serve as absolute public URL
    let profilePictureUrl = null;
    if (user.photoURL) {
      if (String(user.photoURL).startsWith('http')) {
        profilePictureUrl = user.photoURL;
      } else {
        const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
        profilePictureUrl = `${base}/uploads/profile-pictures/${path.basename(String(user.photoURL))}`;
      }
    }

    return res.json({ 
      success: true,
      user: { 
        id: user._id, 
        email: user.email, 
        role: derivedRole,
        roles: user.roles,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name || `${user.firstName} ${user.lastName}`.trim(),
        photoURL: profilePictureUrl
      } 
    });
  } catch (err) {
    console.error('getProfile error', err);
    return next(err);
  }
};

/**
 * Update user profile (requires authentication)
 * Allows updating a safe subset of fields only.
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const allowedFields = ['firstName', 'lastName', 'name','phone','location','state','district','pincode','soilType','crops','language','photoURL'];
    const updates = {};
    
    // Validate firstName and lastName if provided
    if (req.body.firstName) {
      const nameRegex = /^[A-Za-z]{2,}$/;
      if (!nameRegex.test(req.body.firstName)) {
        return res.status(400).json({ message: 'First name must contain only letters and be at least 2 characters' });
      }
      updates.firstName = req.body.firstName;
    }
    
    if (req.body.lastName) {
      const nameRegex = /^[A-Za-z]{2,}$/;
      if (!nameRegex.test(req.body.lastName)) {
        return res.status(400).json({ message: 'Last name must contain only letters and be at least 2 characters' });
      }
      updates.lastName = req.body.lastName;
    }
    
    for (const key of allowedFields) {
      if (key in req.body && key !== 'firstName' && key !== 'lastName') {
        updates[key] = req.body[key];
      }
    }

    // If firstName or lastName is updated, also update the name field
    if (updates.firstName || updates.lastName) {
      const user = await User.findById(userId);
      const firstName = updates.firstName || user.firstName;
      const lastName = updates.lastName || user.lastName;
      updates.name = `${firstName} ${lastName}`.trim();
    }

    const updated = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ message: 'User not found' });

    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: updated._id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        name: updated.name,
        phone: updated.phone,
        verified: updated.verified,
        roles: updated.roles,
        location: updated.location,
        state: updated.state,
        district: updated.district,
        pincode: updated.pincode,
        soilType: updated.soilType,
        crops: updated.crops,
        language: updated.language,
        photoURL: updated.photoURL,
      }
    });
  } catch (err) {
    console.error('updateProfile error', err);
    return next(err);
  }
};

/**
 * Google OAuth callback helper
 */
exports.googleCallback = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(400).json({ message: 'No user attached by passport.' });

    const token = signJwt({ id: user._id, email: user.email, roles: user.roles || ['farmer'], userType: user.userType || 'farmer' });

    const frontendRedirect = process.env.GOOGLE_OAUTH_SUCCESS_REDIRECT || null;
    if (frontendRedirect) {
      return res.redirect(`${frontendRedirect}?token=${token}`);
    }

    return res.json({ message: 'Google login successful', token, user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, name: user.name, roles: user.roles, userType: user.userType } });
  } catch (err) {
    console.error('googleCallback error', err);
    return next(err);
  }
};

/**
 * Verify email with OTP
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and verification code are required.' 
      });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code must be exactly 6 digits.' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already verified.' 
      });
    }

    // Validate OTP
    if (!isOTPValid(code, user.verificationCode, user.verificationCodeExpires)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification code.' 
      });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.verified = true;
    user.emailVerified = true;
    await clearOTP(user);

    return res.json({ 
      success: true, 
      message: 'Email verified successfully. You can now log in.' 
    });
  } catch (err) {
    console.error('verifyEmail error', err);
    return next(err);
  }
};

/**
 * Resend OTP verification code
 */
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required.' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already verified.' 
      });
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Update user with new OTP
    user.verificationCode = otpCode;
    user.verificationCodeExpires = otpExpires;
    await user.save();

    // Send new OTP email (best-effort)
    try {
      await sendOTPEmail(email, user.firstName, user.lastName, otpCode);
      return res.json({ 
        success: true, 
        message: 'New verification code sent to your email.' 
      });
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // In non-production, return the OTP to unblock development
      if ((process.env.NODE_ENV || 'development') !== 'production') {
        return res.json({
          success: true,
          message: 'Email sending failed (dev mode). Use the code shown to verify.',
          devOtp: otpCode,
          expiresAt: otpExpires
        });
      }
      // In production, report failure
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send verification email. Please try again.' 
      });
    }
  } catch (err) {
    console.error('resendOTP error', err);
    return next(err);
  }
};
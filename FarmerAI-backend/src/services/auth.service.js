// src/services/auth.service.js
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const { issueToken } = require('./token.service');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./email.service');

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

/**
 * Register new user
 */
async function registerUser({ name, email, phone, password, confirmPassword }) {
  if (password !== confirmPassword) {
    throw new Error('Password and confirm password do not match.');
  }

  const existing = await User.findOne({ email });
  if (existing) throw new Error('Email already registered.');

  const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const user = new User({
    name,
    email,
    phone,
    password: hashed,
    verified: false,
    roles: ['farmer'],
  });

  await user.save();

  // Generate verification link
  let verificationLink = null;
  try {
    verificationLink = await sendVerificationEmail(email);
  } catch (err) {
    console.warn('Failed to generate verification link:', err.message);
  }

  const token = issueToken({ id: user._id, email: user.email, roles: user.roles });

  return { user, token, verificationLink };
}

/**
 * Login existing user
 */
async function loginUser({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid credentials.');

  if (!user.password) throw new Error('Use Google login for this account.');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Invalid credentials.');

  const token = issueToken({ id: user._id, email: user.email, roles: user.roles });

  return { user, token };
}

/**
 * Generate and save OTP
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

async function sendOtpToUser(user) {
  const otp = generateOtp();
  user.otpHash = hashOtp(otp);
  user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await user.save();

  // TODO: integrate with SMS/Email provider
  return otp;
}

async function verifyUserOtp(user, otp) {
  if (!user.otpHash || !user.otpExpiresAt) throw new Error('No OTP set.');

  if (new Date() > new Date(user.otpExpiresAt)) throw new Error('OTP expired.');

  const hashed = hashOtp(otp);
  if (hashed !== user.otpHash) throw new Error('Invalid OTP.');

  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  user.verified = true;
  await user.save();

  return true;
}

/**
 * Send password reset link
 */
async function sendForgotPassword(email) {
  return sendPasswordResetEmail(email);
}

module.exports = {
  registerUser,
  loginUser,
  sendOtpToUser,
  verifyUserOtp,
  sendForgotPassword,
};

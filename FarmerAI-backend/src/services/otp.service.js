// src/services/otp.service.js
const { sendOtpEmail: sendOtpEmailDirect } = require('../config/email');

/**
 * Generate a random 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP verification email
 */
async function sendOTPEmail(email, firstName, lastName, otpCode) {
  // Keep a simple, reliable template and send via centralized email config
  const htmlName = `${firstName || ''} ${lastName || ''}`.trim();
  const subject = 'Verify Your Email - FarmerAI';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px;">
      <h2 style="color:#166534;">Hello ${htmlName || 'Farmer'}!</h2>
      <p>Use the verification code below. It expires in 10 minutes.</p>
      <div style="border:2px solid #16a34a; border-radius:8px; padding:16px; text-align:center;">
        <span style="font-size:32px; font-weight:700; letter-spacing:6px; font-family:'Courier New', monospace;">${otpCode}</span>
      </div>
    </div>
  `;

  return sendOtpEmailDirect(email, otpCode);
}

/**
 * Check if OTP is valid and not expired
 */
function isOTPValid(otpCode, storedCode, expiresAt) {
  if (!otpCode || !storedCode || !expiresAt) {
    return false;
  }
  
  // Check if OTP matches
  if (otpCode !== storedCode) {
    return false;
  }
  
  // Check if OTP is not expired
  if (new Date() > new Date(expiresAt)) {
    return false;
  }
  
  return true;
}

/**
 * Clear OTP from user record
 */
function clearOTP(user) {
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  return user.save();
}

module.exports = {
  generateOTP,
  sendOTPEmail,
  isOTPValid,
  clearOTP
};












// src/services/otp.service.js
const { sendEmail } = require('./email.service');

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
  const subject = 'Verify Your Email - FarmerAI';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #4CAF50, #8BC34A); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🌱 Email Verification</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Welcome to FarmerAI!</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E7D32; margin-top: 0;">Hello ${firstName} ${lastName}!</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Thank you for registering with FarmerAI. To complete your registration and start using our AI-powered farming assistance, please verify your email address.
        </p>
        
        <div style="background: white; padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center; border: 2px solid #4CAF50;">
          <h3 style="color: #2E7D32; margin-top: 0; font-size: 18px;">Your Verification Code</h3>
          <div style="background: #E8F5E8; padding: 20px; border-radius: 8px; margin: 15px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #2E7D32; letter-spacing: 5px; font-family: 'Courier New', monospace;">
              ${otpCode}
            </span>
          </div>
          <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
            This code will expire in 10 minutes
          </p>
        </div>
        
        <div style="background: #E3F2FD; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #1976D2; margin-top: 0;">📝 Instructions:</h4>
          <ol style="color: #666; line-height: 1.6; padding-left: 20px;">
            <li>Enter the 6-digit code above in the verification form</li>
            <li>Make sure to enter the code within 10 minutes</li>
            <li>If you don't see the email, check your spam folder</li>
            <li>If the code expires, you can request a new one</li>
          </ol>
        </div>
        
        <div style="background: #FFF3E0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9800;">
          <p style="color: #E65100; margin: 0; font-size: 14px;">
            <strong>⚠️ Security Note:</strong> Never share this code with anyone. FarmerAI will never ask for your verification code via phone or email.
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 25px;">
          If you didn't create an account with FarmerAI, please ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>© 2024 FarmerAI. Growing smarter with AI-powered farming assistance.</p>
      </div>
    </div>
  `;
  
  return sendEmail(email, subject, html);
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





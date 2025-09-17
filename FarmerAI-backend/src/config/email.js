// src/config/email.js
const nodemailer = require('nodemailer');

// Read env vars (supports both EMAIL_* and SMTP_* naming)
const HOST = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
const PORT = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);
// STARTTLS on port 587 => secure must be false
const SECURE = false;
const USER = process.env.EMAIL_USER || process.env.SMTP_USER || '';
const PASS = process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
const FROM = process.env.EMAIL_FROM || USER || 'no-reply@farmerai.local';

// Create a Nodemailer transporter configured for STARTTLS (Gmail friendly)
function createEmailTransporter() {
  const base = {
    host: HOST,
    port: PORT,
    secure: SECURE, // STARTTLS
  };

  if (USER && PASS) {
    return nodemailer.createTransport({
      ...base,
      auth: { user: USER, pass: PASS },
    });
  }

  // Transport without auth (useful for local mailcatcher in dev)
  return nodemailer.createTransport(base);
}

const transporter = createEmailTransporter();

// Simple helper to send an OTP email
async function sendOtpEmail(to, otp) {
  const subject = 'Verify your email - FarmerAI';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px;">
      <h2 style="color:#166534;">Email Verification</h2>
      <p>Use the code below to verify your email. It expires in 10 minutes.</p>
      <div style="border:2px solid #16a34a; border-radius:8px; padding:16px; text-align:center;">
        <span style="font-size:32px; font-weight:700; letter-spacing:6px; font-family:'Courier New', monospace;">${otp}</span>
      </div>
      <p style="color:#334155; font-size:12px;">If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `FarmerAI <${FROM}>`,
    to,
    subject,
    html,
  });

  return info;
}

module.exports = {
  transporter,
  sendOtpEmail,
};






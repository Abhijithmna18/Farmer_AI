// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const passportSetup = require('../config/passport'); // ensure passport initialized
const { passport } = require('../config/passport');
const { authenticateToken } = require('../middlewares/auth.middleware');
const {
  registerSchema,
  loginSchema,
  otpSchema,
  forgotPasswordSchema,
  validateBody
} = require('../utils/validators');

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.get('/me', authenticateToken, authController.getProfile);
router.put('/me', authenticateToken, authController.updateProfile);
router.post('/send-verification', authController.sendEmailVerification);
router.post('/verify-email', authController.verifyEmail); // OTP verification
router.post('/resend-otp', authController.resendOTP); // Resend OTP
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/forgot-password', authController.forgotPassword);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), authController.googleCallback);

module.exports = router;

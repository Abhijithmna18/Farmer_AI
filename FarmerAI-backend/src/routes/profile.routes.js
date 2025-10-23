const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Profile routes
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.get('/stats', profileController.getUserStats);
router.get('/activity', profileController.getActivityFeed);

// Profile picture routes
router.post('/profile-picture', profileController.upload.single('profilePicture'), profileController.uploadProfilePicture);
router.delete('/profile-picture', profileController.removeProfilePicture);

// Verification document routes
router.post('/verification-document', profileController.upload.single('document'), profileController.uploadVerificationDocument);

// Role-specific profile routes
router.put('/farmer', profileController.updateFarmerProfile);
router.put('/buyer', profileController.updateBuyerProfile);
router.put('/warehouse-owner', profileController.updateWarehouseOwnerProfile);
router.post('/become-warehouse-owner', profileController.becomeWarehouseOwner);

// Email and security routes
router.put('/email', profileController.updateEmail);

module.exports = router;









const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Profile routes
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.post('/become-warehouse-owner', profileController.becomeWarehouseOwner);
router.post('/profile-picture', profileController.upload.single('profilePicture'), profileController.uploadProfilePicture);
router.delete('/profile-picture', profileController.removeProfilePicture);
router.put('/email', profileController.updateEmail);

module.exports = router;









const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { eventUpload, handleMulterError } = require('../middlewares/imageUpload.middleware');
const uploadController = require('../controllers/upload.controller');

// Apply authentication to all upload routes
router.use(authenticateToken);

// Upload single image for events
router.post('/image', eventUpload.single('image'), handleMulterError, uploadController.uploadEventImage);

// Delete uploaded image
router.delete('/image/:fileName', uploadController.deleteEventImage);

module.exports = router;


const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const { galleryUpload, handleMulterError } = require('../middlewares/imageUpload.middleware');
const galleryController = require('../controllers/gallery.controller');

// Public routes (no authentication required)
router.get('/', galleryController.getGalleryItems);
router.get('/:id', galleryController.getGalleryItem);

// Admin routes (require authentication and admin role)
router.use(authenticateToken);
router.use(authorizeRoles(['admin']));

// CRUD operations for gallery management
router.post('/', galleryUpload.single('image'), handleMulterError, galleryController.createGalleryItem);
router.put('/:id', galleryUpload.single('image'), handleMulterError, galleryController.updateGalleryItem);
router.delete('/:id', galleryController.deleteGalleryItem);
router.post('/reorder', galleryController.reorderGalleryItems);

module.exports = router;


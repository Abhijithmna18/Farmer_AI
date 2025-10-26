const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const { blogUpload, handleMulterError } = require('../middlewares/imageUpload.middleware');
const blogController = require('../controllers/blog.controller');

// Public routes (no authentication required)
router.get('/', blogController.getBlogPosts);
router.get('/slug/:slug', blogController.getBlogPostBySlug);
router.get('/:id', blogController.getBlogPost);

// Admin routes (require authentication and admin role)
router.use(authenticateToken);
router.use(authorizeRoles(['admin']));

// CRUD operations for blog management
router.post('/', blogUpload.single('coverImage'), handleMulterError, blogController.createBlogPost);
router.put('/:id', blogUpload.single('coverImage'), handleMulterError, blogController.updateBlogPost);
router.delete('/:id', blogController.deleteBlogPost);

module.exports = router;


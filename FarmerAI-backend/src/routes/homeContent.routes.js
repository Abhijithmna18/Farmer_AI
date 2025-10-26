const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const { homeContentUpload, handleMulterError } = require('../middlewares/imageUpload.middleware');
const homeContentController = require('../controllers/homeContent.controller');

// Public routes (no authentication required)
router.get('/', homeContentController.getHomeContentItems);
router.get('/section/:section', homeContentController.getHomeContentBySection);
router.get('/:id', homeContentController.getHomeContentItem);

// Admin routes (require authentication and admin role)
router.use(authenticateToken);
router.use(authorizeRoles(['admin']));

// CRUD operations for home content management
router.post('/', homeContentUpload.single('image'), handleMulterError, homeContentController.createHomeContentItem);
router.put('/:id', homeContentUpload.single('image'), handleMulterError, homeContentController.updateHomeContentItem);
router.delete('/:id', homeContentController.deleteHomeContentItem);
router.post('/reorder', homeContentController.reorderHomeContentItems);

module.exports = router;



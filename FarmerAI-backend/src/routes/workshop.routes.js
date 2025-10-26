// src/routes/workshop.routes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const { workshopUpload, handleMulterError } = require('../middlewares/imageUpload.middleware');
const {
  getAllWorkshops,
  getWorkshopById,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  createWorkshopSubscriptionOrder,
  verifyWorkshopSubscriptionPayment,
  getUserSubscriptions,
  checkWorkshopAccess
} = require('../controllers/workshop.controller');

// Public routes
router.get('/', getAllWorkshops);

// Workshop access check (protected, must come before /:id to avoid route collision)
router.get('/:id/access', authenticateToken, checkWorkshopAccess);

// Public route for getting workshop by ID (must come after /:id/access)
router.get('/:id', getWorkshopById);

// Protected routes (require authentication)
router.use(authenticateToken);

// Subscription routes
router.post('/subscription/order', createWorkshopSubscriptionOrder);
router.post('/subscription/verify', verifyWorkshopSubscriptionPayment);
router.get('/subscriptions', getUserSubscriptions);

// Admin routes (require admin role)
router.use(authorizeRoles(['admin']));

// Workshop CRUD operations
router.post('/', workshopUpload.single('thumbnail'), handleMulterError, createWorkshop);
router.put('/:id', workshopUpload.single('thumbnail'), handleMulterError, updateWorkshop);
router.delete('/:id', deleteWorkshop);

module.exports = router;
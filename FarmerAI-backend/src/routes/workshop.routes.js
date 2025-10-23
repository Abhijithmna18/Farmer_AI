// src/routes/workshop.routes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const {
  getAllWorkshops,
  getWorkshopById,
  createWorkshopSubscriptionOrder,
  verifyWorkshopSubscriptionPayment,
  getUserSubscriptions,
  checkWorkshopAccess
} = require('../controllers/workshop.controller');

// Public routes
router.get('/', getAllWorkshops);
router.get('/:id', getWorkshopById);

// Protected routes (require authentication)
router.use(authenticateToken);

// Subscription routes
router.post('/subscription/order', createWorkshopSubscriptionOrder);
router.post('/subscription/verify', verifyWorkshopSubscriptionPayment);
router.get('/subscriptions', getUserSubscriptions);
router.get('/:id/access', checkWorkshopAccess);

module.exports = router;
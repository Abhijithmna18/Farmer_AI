const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../middlewares/auth.middleware');
const marketplaceController = require('../controllers/marketplace.controller');
const cartController = require('../controllers/cart.controller');
const orderController = require('../controllers/order.controller');
const paymentController = require('../controllers/payment.controller');

// Configure multer for product image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 images per product
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Product routes
router.get('/products', marketplaceController.getProducts);
router.get('/products/featured', marketplaceController.getFeaturedProducts);
router.get('/products/categories', marketplaceController.getCategories);
router.get('/products/:id', marketplaceController.getProductById);
router.post('/products', upload.array('images', 5), marketplaceController.createProduct);
router.put('/products/:id', upload.array('images', 5), marketplaceController.updateProduct);
router.delete('/products/:id', marketplaceController.deleteProduct);

// Farmer-specific routes
router.get('/farmers/:farmerId/products', marketplaceController.getFarmerProducts);
router.get('/farmers/nearby', marketplaceController.getNearbyFarmers);

// Cart routes
router.get('/cart', cartController.getCart);
router.post('/cart/add', cartController.addToCart);
router.put('/cart/items/:productId', cartController.updateCartItem);
router.delete('/cart/items/:productId', cartController.removeFromCart);
router.delete('/cart/clear', cartController.clearCart);
router.get('/cart/summary', cartController.getCartSummary);
router.post('/cart/validate', cartController.validateCart);

// Save for later (wishlist) routes
router.post('/cart/save/:productId', cartController.saveForLater);
router.post('/cart/move/:productId', cartController.moveToCart);
router.get('/cart/saved', cartController.getSavedItems);
router.delete('/cart/saved/:productId', cartController.removeSavedItem);

// Order routes
router.post('/orders', orderController.createOrder);
router.get('/orders', orderController.getUserOrders);
router.get('/orders/:id', orderController.getOrderById);
router.put('/orders/:id/status', orderController.updateOrderStatus);
router.post('/orders/:id/cancel', orderController.cancelOrder);
router.post('/orders/:id/messages', orderController.addOrderMessage);
router.get('/orders/stats', orderController.getOrderStats);
router.get('/orders/date-range', orderController.getOrdersByDateRange);

// Payment routes
router.post('/payments/create', paymentController.createPaymentOrder);
router.post('/payments/verify', paymentController.verifyPayment);
router.get('/payments/:transactionId/status', paymentController.getPaymentStatus);
router.post('/payments/:transactionId/refund', paymentController.processRefund);
router.get('/payments', paymentController.getUserTransactions);
router.get('/payments/stats', paymentController.getTransactionStats);

// Marketplace statistics
router.get('/stats', marketplaceController.getMarketplaceStats);

module.exports = router;

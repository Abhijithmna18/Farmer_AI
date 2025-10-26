// src/routes/owner.routes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const warehouseController = require('../controllers/warehouse.controller');
const bookingController = require('../controllers/booking.controller');
const ownerController = require('../controllers/owner.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage for warehouse photos (disk storage)
const warehouseUploadsDir = path.join(__dirname, '../../uploads/warehouses');
// Ensure upload directory exists (skip in serverless environments)
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  if (!fs.existsSync(warehouseUploadsDir)) {
    fs.mkdirSync(warehouseUploadsDir, { recursive: true });
  }
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure directory exists before saving (skip in serverless environments)
    if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      if (!fs.existsSync(warehouseUploadsDir)) {
        fs.mkdirSync(warehouseUploadsDir, { recursive: true });
      }
    }
    cb(null, warehouseUploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${file.fieldname}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// All routes require auth and owner role
router.use(authenticateToken);
router.use(authorizeRoles(['warehouse-owner']));

// Dashboard
router.get('/dashboard', ownerController.getDashboardStats);
router.get('/customers', ownerController.getCustomers);

// Test route to verify owner routes are working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Owner routes are working!', user: req.user?.email });
});

// Warehouses (owner scope)
// Accept multipart form with photos[] and optional warehouseData JSON
router.post('/warehouses', (req, res, next) => {
  upload.array('photos', 10)(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        error: err.message
      });
    }
    next();
  });
}, warehouseController.createWarehouse);
router.get('/warehouses', warehouseController.getOwnerWarehouses);
router.patch('/warehouses/:id', warehouseController.updateWarehouse);
router.delete('/warehouses/:id', warehouseController.deleteWarehouse);
router.patch('/warehouses/:id/status', warehouseController.setWarehouseStatus);

// Bookings (owner scope)
router.get('/bookings', bookingController.getBookings);
router.patch('/bookings/:id/approve', bookingController.approveBooking);
router.patch('/bookings/:id/reject', bookingController.rejectBooking);
router.get('/bookings/:id', bookingController.getBookingById);

// Revenue (owner scope)
router.get('/revenue', bookingController.getOwnerRevenue);
router.get('/revenue/timeseries', bookingController.getOwnerRevenueTimeseries);
router.post('/bookings/:id/refund', bookingController.refundBooking);

// Analytics (owner scope)
router.get('/analytics', ownerController.getAnalytics);
router.get('/analytics/trends', bookingController.getOwnerAnalyticsTrends);
router.get('/analytics/occupancy', bookingController.getOwnerOccupancyCalendar);

module.exports = router;



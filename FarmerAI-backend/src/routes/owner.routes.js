// src/routes/owner.routes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const warehouseController = require('../controllers/warehouse.controller');
const bookingController = require('../controllers/booking.controller');
const ownerController = require('../controllers/owner.controller');

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
router.post('/warehouses', warehouseController.createWarehouse);
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
router.get('/analytics/trends', bookingController.getOwnerAnalyticsTrends);
router.get('/analytics/occupancy', bookingController.getOwnerOccupancyCalendar);

module.exports = router;



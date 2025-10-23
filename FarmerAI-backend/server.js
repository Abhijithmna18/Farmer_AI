// server.js
require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { connectDB } = require('./src/config/db');
const { initPassport, passport } = require('./src/config/passport');
const errorHandler = require('./src/middlewares/error.middleware');
const logger = require('./src/utils/logger');
const reminderService = require('./src/services/reminder.service');
const enhancedSensorDataScheduler = require('./src/services/enhanced-sensor-data-scheduler.service');
const mqttAdafruitService = require('./src/services/mqtt-adafruit.service');
const { initRealtime } = require('./src/services/realtime.service');

const app = express();

// Create upload directories if they don't exist
const createUploadDirectories = () => {
  const uploadDirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads', 'profile-pictures'),
    path.join(__dirname, 'uploads', 'warehouses'),
    path.join(__dirname, 'uploads', 'feedback-attachments'),
    path.join(__dirname, 'src', 'uploads')
  ];

  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created upload directory: ${dir}`);
    }
  });
};

// Initialize upload directories
createUploadDirectories();

// --- CORS setup for local frontend with Authorization header and credentials ---
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['x-rtb-fingerprint-id']
};
app.use(cors(corsOptions));
// Explicitly handle preflight
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static: serve uploaded images
app.use('/api/plants/uploads', express.static(path.join(__dirname, 'src', 'uploads')));
app.use('/uploads/profile-pictures', express.static(path.join(__dirname, 'uploads', 'profile-pictures')));
app.use('/uploads/warehouses', express.static(path.join(__dirname, 'uploads', 'warehouses')));

// Connect Database
connectDB();

// Routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/assistant', require('./src/routes/assistant.routes'));
app.use('/api/recommendations', require('./src/routes/recommendation.routes'));
app.use('/api/reports', require('./src/routes/reports.routes'));
app.use('/api/favorites', require('./src/routes/favorite.routes'));
app.use('/api/events', require('./src/routes/events.routes'));
// Admin authentication is handled through the main auth routes
// Protected admin routes
app.use('/api/admin', require('./src/routes/admin.routes'));
app.use('/api/crops', require('./src/routes/crops.routes'));
app.use('/api/calendar', require('./src/routes/calendar.routes.js'));
app.use('/api/search', require('./src/routes/search.routes'));
app.use('/api', require('./src/routes/chat'));
app.use('/api/plants', require('./src/routes/plant.routes'));
app.use('/api/settings', require('./src/routes/settings.routes'));
app.use('/api/user', require('./src/routes/profile.routes'));
app.use('/api/marketplace', require('./src/routes/marketplace.routes'));
app.use('/api/soil-records', require('./src/routes/soilRecord.routes'));
app.use('/api/equipment', require('./src/routes/equipment.routes'));
app.use('/api/community', require('./src/routes/community.routes'));
app.use('/api/feedback', require('./src/routes/feedback.routes'));
app.use('/api/owner', require('./src/routes/owner.routes'));
app.use('/api/warehouses', require('./src/routes/warehouse.routes'));
app.use('/api/bookings', require('./src/routes/booking.routes'));
app.use('/api/warehouse-bookings', require('./src/routes/warehouse-booking.routes'));
app.use('/api/v2', require('./src/routes/warehouse-booking-v2.routes'));
app.use('/api/razorpay', require('./src/routes/razorpay.routes'));
app.use('/api/payments', require('./src/routes/payments.routes'));
app.use('/api/market', require('./src/routes/market.routes'));
app.use('/api/test-razorpay', require('./src/routes/test-razorpay.routes'));
app.use('/api/contact', require('./src/routes/contact.routes'));
app.use('/api/farm-monitoring', require('./src/routes/farm-monitoring.routes'));
app.use('/api/workshops', require('./src/routes/workshop.routes'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'FarmerAI backend running 🚀' });
});

// Error handler (must be last)
app.use(errorHandler);

// Export app for testing
module.exports = app;

// Start server only if this file is run directly (not imported for testing)
if (require.main === module) {
  const PORT = process.env.PORT || 5002;
  const server = http.createServer(app);
  // Initialize Socket.IO realtime service
  try {
    initRealtime(server, [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175', // Added 5175
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175' // Added 5175
    ]);
    logger.info('🔌 Realtime service initialized');
  } catch (e) {
    logger.error('Failed to initialize realtime service:', e?.message || e);
  }
  server.listen(PORT, async () => {
    logger.info(`✅ Server running on http://localhost:${PORT}`);
    // Bootstrap superadmin if env configured
    try {
      const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;
      if (SUPERADMIN_EMAIL) {
        const User = require('./src/models/User');
        const user = await User.findOne({ email: SUPERADMIN_EMAIL });
        if (user && !user.roles.includes('superadmin')) {
          user.roles = Array.from(new Set([...(user.roles || []), 'superadmin']));
          await user.save();
          logger.info(`🔐 Bootstrapped superadmin role to ${SUPERADMIN_EMAIL}`);
        }
      }
    } catch (e) {
      logger.error('Failed to bootstrap superadmin:', e?.message || e);
    }

    // Start reminder service
    try {
      reminderService.start();
      logger.info('📧 Reminder service started successfully');
    } catch (e) {
      logger.error('Failed to start reminder service:', e?.message || e);
    }
    
    // Start enhanced sensor data scheduler
    try {
      enhancedSensorDataScheduler.start();
      logger.info('🌡️ Enhanced sensor data scheduler started successfully');
    } catch (e) {
      logger.error('Failed to start enhanced sensor data scheduler:', e?.message || e);
    }
    
    // Start MQTT Adafruit service
    try {
      mqttAdafruitService.connect();
      logger.info('📡 MQTT Adafruit service started successfully');
    } catch (e) {
      logger.error('Failed to start MQTT Adafruit service:', e?.message || e);
    }
  });
}
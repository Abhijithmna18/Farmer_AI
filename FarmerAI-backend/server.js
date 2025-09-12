// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const { connectDB } = require('./src/config/db');
const { initPassport, passport } = require('./src/config/passport');
const errorHandler = require('./src/middlewares/error.middleware');
const logger = require('./src/utils/logger');
const reminderService = require('./src/services/reminder.service');

const app = express();

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

// Connect Database
connectDB();

// Routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/assistant', require('./src/routes/assistant.routes'));
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
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, async () => {
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
  });
}

// src/config/db.js
const mongoose = require("mongoose");
const logger = console; // replace with your custom logger if available

let isConnected = false; // Track connection status for serverless

const connectDB = async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/farmerai";

  // If already connected (serverless caching), reuse connection
  if (isConnected && mongoose.connection.readyState === 1) {
    logger.info("Using existing MongoDB connection");
    return;
  }

  try {
    logger.info("Attempting to connect to MongoDB:", mongoUri);
    // Modern connection (no need for deprecated options)
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout for serverless
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info(
      `MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`
    );
  } catch (err) {
    logger.error("MongoDB connection error:", err);
    // In serverless, don't exit - just throw the error
    if (process.env.VERCEL) {
      throw err;
    }
    // In production: exit process or trigger retry
    process.exit(1);
  }
};

// Optional graceful close (useful for tests/shutdown)
const closeDB = async () => {
  await mongoose.disconnect();
};

module.exports = {
  connectDB,
  closeDB,
};
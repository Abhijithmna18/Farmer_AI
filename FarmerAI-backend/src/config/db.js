// src/config/db.js
const mongoose = require("mongoose");
const logger = console; // replace with your custom logger if available

const connectDB = async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/farmerai";

  try {
    // Modern connection (no need for deprecated options)
    await mongoose.connect(mongoUri);

    logger.info(
      `MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`
    );
  } catch (err) {
    logger.error("MongoDB connection error:", err);
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

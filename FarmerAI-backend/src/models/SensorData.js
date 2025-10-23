// src/models/SensorData.js
const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema(
  {
    temperature: {
      type: Number,
      required: true,
      min: -50,
      max: 100
    },
    humidity: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    soilMoisture: {
      type: Number,
      required: true,
      min: 0,
      max: 4095
    },
    timestamp: {
      type: Date,
      required: true,
      unique: true // Prevent duplicate entries based on timestamp
    },
    source: {
      type: String,
      default: 'ESP32',
      enum: ['ESP32', 'Manual', 'Other']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // Optional: associate with specific user
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt fields
  }
);

// Index for faster queries
sensorDataSchema.index({ timestamp: -1 });
sensorDataSchema.index({ userId: 1, timestamp: -1 });

// Virtual field for irrigation status
sensorDataSchema.virtual('needsIrrigation').get(function() {
  return this.soilMoisture < 300;
});

// Method to get status message
sensorDataSchema.methods.getStatusMessage = function() {
  if (this.soilMoisture < 300) {
    return 'Irrigation Needed';
  } else if (this.soilMoisture < 500) {
    return 'Soil Moisture Low';
  } else if (this.soilMoisture < 800) {
    return 'Soil Moisture Normal';
  } else {
    return 'Soil Moisture High';
  }
};

// Static method to get latest reading
sensorDataSchema.statics.getLatest = async function(userId = null) {
  const query = userId ? { userId } : {};
  return await this.findOne(query).sort({ timestamp: -1 });
};

// Static method to get historical data
sensorDataSchema.statics.getHistorical = async function(hours = 24, userId = null) {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  const query = {
    timestamp: { $gte: startTime }
  };
  if (userId) {
    query.userId = userId;
  }
  return await this.find(query).sort({ timestamp: 1 });
};

const SensorData = mongoose.model('SensorData', sensorDataSchema);

module.exports = SensorData;

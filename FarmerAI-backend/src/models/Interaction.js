const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  soilType: {
    type: String,
    required: true,
  },
  season: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  recommendedCrops: [{
    type: String,
  }],
  selectedCrop: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Interaction', interactionSchema);
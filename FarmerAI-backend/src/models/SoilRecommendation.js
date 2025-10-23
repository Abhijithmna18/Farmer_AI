// src/models/SoilRecommendation.js
const mongoose = require('mongoose');

const SoilRecommendationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    N: { type: Number, required: true },
    P: { type: Number, required: true },
    K: { type: Number, required: true },
    rainfall: { type: Number, required: true },
    humidity: { type: Number, required: true },
    recommendedCrops: [{
      crop: String,
      variety: String,
      yieldEstimation: String,
      reason: String,
      season: String,
      plantingWindow: String
    }]
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model('SoilRecommendation', SoilRecommendationSchema);
















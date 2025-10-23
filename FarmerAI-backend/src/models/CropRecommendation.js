// src/models/CropRecommendation.js
const mongoose = require('mongoose');

const CropRecommendationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    crop: { type: String, required: true },
    variety: { type: String },
    reason: { type: String },
    expectedYield: { type: String },
    profitEstimation: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model('CropRecommendation', CropRecommendationSchema);
















// src/models/Plant.js
const mongoose = require('mongoose');

const PlantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    scientificName: { type: String, trim: true },
    growthTime: { type: String, trim: true },
    climate: { type: String, trim: true },
    season: { type: String, trim: true },
    uses: { type: [String], default: [] },
    imageUrl: { type: String, trim: true },
    identificationMethod: { type: String, enum: ['ollama', 'gemini', 'hf', 'manual'], default: 'manual' },
    shortDescription: { type: String, trim: true },
    confidence: { type: Number, min: 0, max: 1 }, // For HF classification confidence
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional: associate with user
  },
  { timestamps: true }
);

// Add indexes for better search performance
PlantSchema.index({ name: 'text', scientificName: 'text' });
PlantSchema.index({ identificationMethod: 1 });
PlantSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Plant', PlantSchema);
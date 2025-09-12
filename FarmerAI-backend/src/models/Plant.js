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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plant', PlantSchema);
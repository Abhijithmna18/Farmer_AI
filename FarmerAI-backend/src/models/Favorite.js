// src/models/Favorite.js
const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    crop: { type: String, required: true },
    source: { type: String, enum: ['soil', 'ai', 'manual'], default: 'ai' },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

FavoriteSchema.index({ userId: 1, crop: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', FavoriteSchema);
















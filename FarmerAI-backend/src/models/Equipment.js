const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  start: { type: Date, required: true },
  end: { type: Date, required: true },
});

const equipmentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 1000 },
    type: { type: String, required: true, trim: true }, // e.g., tractor, tiller, pump
    condition: { type: String, enum: ['new', 'good', 'fair', 'needs_repair'], default: 'good' },
    mode: { type: String, enum: ['rent', 'sell'], required: true },
    images: [{ url: { type: String, required: true }, alt: { type: String } }],

    // Pricing
    pricePerDay: { type: Number, min: 0 },
    sellPrice: { type: Number, min: 0 },

    // Location
    location: {
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },

    availability: [availabilitySchema],
    contactPreference: { type: String, enum: ['chat', 'phone', 'both'], default: 'chat' },

    status: { type: String, enum: ['draft', 'active', 'unavailable', 'sold', 'archived'], default: 'active', index: true },
    tags: [{ type: String, trim: true, lowercase: true }],
  },
  {
    timestamps: true,
  }
);

equipmentSchema.index({ owner: 1, status: 1 });
equipmentSchema.index({ type: 1, status: 1 });
equipmentSchema.index({ 'location.state': 1, 'location.city': 1 });

module.exports = mongoose.model('Equipment', equipmentSchema);

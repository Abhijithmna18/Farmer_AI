const mongoose = require('mongoose');

const soilRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fieldName: { type: String, trim: true },
    sampleDate: { type: Date, required: true },
    location: {
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
      address: { type: String },
      state: { type: String },
      district: { type: String },
      pincode: { type: String },
    },
    // Basic soil metrics
    ph: { type: Number, min: 0, max: 14 },
    nitrogen: { type: Number }, // N (ppm)
    phosphorus: { type: Number }, // P (ppm)
    potassium: { type: Number }, // K (ppm)
    organicMatter: { type: Number }, // %
    electricalConductivity: { type: Number }, // dS/m
    moisture: { type: Number }, // %
    texture: { type: String, enum: ['clay', 'sandy', 'loamy', 'silt', 'peat', 'chalky', 'other'], default: 'loamy' },

    recommendations: [{ type: String }],
    notes: { type: String, maxlength: 1000 },
    attachments: [{ type: String }], // file URLs

    // Tag for linking with crop/season if needed
    season: { type: String },
    cropName: { type: String },
  },
  {
    timestamps: true,
  }
);

soilRecordSchema.index({ user: 1, sampleDate: -1 });
soilRecordSchema.index({ 'location.state': 1, 'location.district': 1 });

module.exports = mongoose.model('SoilRecord', soilRecordSchema);

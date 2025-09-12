const mongoose = require('mongoose');

const EventRegistrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['interested', 'going', 'waitlisted', 'cancelled', 'checked_in'], default: 'interested', index: true },
    notes: { type: String },
    checkInCode: { type: String },
    checkInAt: { type: Date },
    paymentStatus: { type: String, enum: ['none', 'pending', 'paid', 'refunded'], default: 'none' },
  },
  { timestamps: true }
);

EventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', EventRegistrationSchema);






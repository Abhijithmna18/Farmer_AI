const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  coordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    // [lng, lat]
    coordinates: { type: [Number], default: undefined },
  },
}, { _id: false });

const recurrenceSchema = new mongoose.Schema({
  frequency: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
  interval: { type: Number, default: 1 },
  byWeekday: [{ type: Number }],
  endDate: { type: Date },
}, { _id: false });

const reminderSchema = new mongoose.Schema({
  offsetMinutes: { type: Number, default: 1440 }, // 24h before by default
  channel: { type: String, enum: ['email', 'in_app'], default: 'email' },
}, { _id: false });

const imageSchema = new mongoose.Schema({ url: { type: String, required: true }, alt: { type: String } }, { _id: false });

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    dateTime: { type: Date, required: true },
    endDateTime: { type: Date },
    location: { type: String, required: true }, // legacy string
    locationDetail: locationSchema, // enhanced location
    description: { type: String, required: true },
    farmerName: { type: String, required: true },
    farmerEmail: { type: String, required: true },

    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { type: String, index: true },
    tags: [{ type: String, index: true }],
    images: [imageSchema],
    attachments: [{ type: String }],

    capacity: { type: Number, default: 0 },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    price: { type: Number, default: 0 },
    recurrence: recurrenceSchema,
    reminders: [reminderSchema],
    registrationLink: { type: String },

    status: {
      type: String,
      enum: ['draft', 'pending', 'verified', 'published', 'cancelled', 'rejected', 'archived'],
      default: 'pending',
      index: true,
    },
    verificationToken: { type: String },
  },
  { timestamps: true }
);

EventSchema.index({ dateTime: 1 });
EventSchema.index({ 'locationDetail.coordinates': '2dsphere' });
EventSchema.index({ category: 1, status: 1 });
EventSchema.index({ tags: 1 });

module.exports = mongoose.model('Event', EventSchema);

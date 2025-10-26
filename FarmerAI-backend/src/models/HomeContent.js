const mongoose = require('mongoose');

const homeContentSchema = new mongoose.Schema({
  section: {
    type: String,
    enum: ['hero-banner', 'featured-events', 'testimonials', 'stats', 'about', 'services'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subtitle: {
    type: String,
    maxlength: 500
  },
  description: {
    type: String,
    maxlength: 2000
  },
  image: {
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    filename: {
      type: String,
      required: true
    }
  },
  link: {
    type: String,
    trim: true
  },
  linkText: {
    type: String,
    trim: true,
    maxlength: 50
  },
  displayOrder: {
    type: Number,
    default: 0,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  // For stats section
  stats: [{
    label: String,
    value: Number,
    icon: String
  }],
  // For testimonials section
  testimonials: [{
    name: String,
    role: String,
    content: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
homeContentSchema.index({ section: 1, isActive: 1 });
homeContentSchema.index({ displayOrder: 1 });
homeContentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('HomeContent', homeContentSchema);


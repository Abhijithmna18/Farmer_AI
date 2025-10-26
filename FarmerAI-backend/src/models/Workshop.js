// src/models/Workshop.js
const mongoose = require('mongoose');

const WorkshopSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String, // URL to thumbnail image
      required: true
    },
    thumbnailFilename: {
      type: String // Store filename for deletion
    },
    videoUrl: {
      type: String, // URL to video (YouTube, Vimeo, etc.)
      required: true
    },
    duration: {
      type: Number, // Duration in minutes
      required: true
    },
    category: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'specialized'],
      default: 'beginner'
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    price: {
      type: Number, // Price for premium workshops (in INR)
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    tags: [{
      type: String,
      trim: true
    }],
    instructor: {
      name: {
        type: String,
        required: true
      },
      bio: {
        type: String
      },
      avatar: {
        type: String // URL to instructor avatar
      }
    },
    materials: [{
      name: {
        type: String,
        required: true
      },
      description: {
        type: String
      }
    }],
    learningOutcomes: [{
      type: String
    }],
    prerequisites: [{
      type: String
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    views: {
      type: Number,
      default: 0
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
WorkshopSchema.index({ title: 'text', description: 'text' });
WorkshopSchema.index({ category: 1 });
WorkshopSchema.index({ isPremium: 1 });
WorkshopSchema.index({ isActive: 1 });
WorkshopSchema.index({ createdAt: -1 });

// Virtual for checking if workshop is free
WorkshopSchema.virtual('isFree').get(function() {
  return !this.isPremium || this.price <= 0;
});

// Instance methods for YouTube integration
WorkshopSchema.methods.getYouTubeVideoId = function() {
  if (!this.videoUrl) return null;
  
  const youtubeRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = this.videoUrl.match(youtubeRegExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

WorkshopSchema.methods.getYouTubeThumbnail = function() {
  const videoId = this.getYouTubeVideoId();
  if (!videoId) return null;
  
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

WorkshopSchema.methods.getYouTubeEmbedUrl = function() {
  const videoId = this.getYouTubeVideoId();
  if (!videoId) return null;
  
  return `https://www.youtube.com/embed/${videoId}`;
};

module.exports = mongoose.model('Workshop', WorkshopSchema);
const mongoose = require('mongoose');

const workshopTutorialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: true
  },
  description: {
    type: String,
    required: true,
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
  videoLink: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validate YouTube URL format
        return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(v);
      },
      message: 'Please provide a valid YouTube URL'
    }
  },
  category: {
    type: String,
    enum: ['farming-techniques', 'equipment', 'crop-management', 'soil-health', 'irrigation', 'pest-control', 'harvesting', 'marketing', 'other'],
    required: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
    index: true
  },
  duration: {
    type: Number, // in minutes
    min: 1
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  instructor: {
    name: {
      type: String,
      required: true
    },
    bio: {
      type: String,
      maxlength: 500
    },
    avatar: {
      type: String
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  displayOrder: {
    type: Number,
    default: 0,
    index: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
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

// Helper method to extract YouTube video ID
workshopTutorialSchema.methods.getYouTubeVideoId = function() {
  const url = this.videoLink;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Helper method to get YouTube thumbnail
workshopTutorialSchema.methods.getYouTubeThumbnail = function() {
  const videoId = this.getYouTubeVideoId();
  return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
};

// Indexes for better query performance
workshopTutorialSchema.index({ category: 1, isActive: 1 });
workshopTutorialSchema.index({ difficulty: 1, isActive: 1 });
workshopTutorialSchema.index({ isFeatured: 1, isActive: 1 });
workshopTutorialSchema.index({ displayOrder: 1 });
workshopTutorialSchema.index({ viewCount: -1 });
workshopTutorialSchema.index({ 'rating.average': -1 });

module.exports = mongoose.model('WorkshopTutorial', workshopTutorialSchema);



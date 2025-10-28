const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  excerpt: {
    type: String,
    maxlength: 500
  },
  coverImage: {
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
  category: {
    type: String,
    enum: ['ai-farming', 'soil-health', 'crop-management', 'technology', 'sustainability', 'market-trends', 'general'],
    required: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  publishedAt: {
    type: Date
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  metaDescription: {
    type: String,
    maxlength: 160
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate slug from title before saving
blogSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Indexes for better query performance
blogSchema.index({ category: 1, isPublished: 1 });
blogSchema.index({ featured: 1, isPublished: 1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ viewCount: -1 });

module.exports = mongoose.model('Blog', blogSchema);




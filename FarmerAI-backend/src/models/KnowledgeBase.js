const mongoose = require('mongoose');

// Knowledge base article schema
const knowledgeBaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
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
  
  // Article categorization
  category: {
    type: String,
    required: true,
    enum: [
      'crop-guides', 'pest-disease', 'irrigation', 'soil-health',
      'organic-farming', 'equipment', 'technology', 'government-schemes',
      'market-trends', 'weather', 'general', 'tutorials', 'faq'
    ],
    index: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Article content
  sections: [{
    title: { type: String, required: true },
    content: { type: String, required: true },
    order: { type: Number, default: 0 }
  }],
  
  // Media content
  images: [{
    url: { type: String, required: true },
    alt: { type: String },
    caption: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],
  videos: [{
    url: { type: String, required: true },
    title: { type: String },
    duration: { type: Number }, // in seconds
    thumbnail: { type: String }
  }],
  documents: [{
    url: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String }, // pdf, doc, etc.
    size: { type: Number } // in bytes
  }],
  
  // Author information
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coAuthors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Article metadata
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  estimatedReadTime: { type: Number, default: 5 }, // in minutes
  language: { type: String, default: 'en' },
  
  // Target audience
  targetCrops: [{
    type: String,
    trim: true
  }],
  targetRegions: [{
    district: { type: String },
    state: { type: String }
  }],
  targetExperience: [{
    type: String,
    enum: ['new-farmer', 'experienced', 'expert']
  }],
  
  // Article status and visibility
  status: {
    type: String,
    enum: ['draft', 'review', 'published', 'archived', 'hidden'],
    default: 'draft',
    index: true
  },
  visibility: {
    type: String,
    enum: ['public', 'members-only', 'premium'],
    default: 'public'
  },
  
  // Article engagement
  views: { type: Number, default: 0 },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  shares: { type: Number, default: 0 },
  
  // Article feedback
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  
  // Article comments and discussions
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    replies: [{
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true,
        maxlength: 500
      },
      createdAt: { type: Date, default: Date.now }
    }],
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Article versioning
  version: { type: Number, default: 1 },
  previousVersions: [{
    version: { type: Number },
    content: { type: String },
    updatedAt: { type: Date },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Article SEO and discovery
  slug: { type: String, unique: true, index: true },
  metaDescription: { type: String, maxlength: 160 },
  keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Article features
  isFeatured: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  
  // Article moderation
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: { type: String },
  publishedAt: { type: Date },
  
  // Article analytics
  analytics: {
    dailyViews: [{
      date: { type: Date },
      views: { type: Number }
    }],
    topSections: [{
      sectionTitle: { type: String },
      views: { type: Number }
    }],
    userEngagement: {
      averageTimeOnPage: { type: Number }, // in seconds
      bounceRate: { type: Number }, // percentage
      completionRate: { type: Number } // percentage
    }
  },
  
  // Related articles
  relatedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KnowledgeBase'
  }],
  
  // Article updates
  lastUpdated: { type: Date, default: Date.now },
  updateReason: { type: String },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
knowledgeBaseSchema.index({ category: 1, status: 1, createdAt: -1 });
knowledgeBaseSchema.index({ tags: 1 });
knowledgeBaseSchema.index({ targetCrops: 1 });
knowledgeBaseSchema.index({ 'targetRegions.district': 1, 'targetRegions.state': 1 });
knowledgeBaseSchema.index({ author: 1, createdAt: -1 });
knowledgeBaseSchema.index({ title: 'text', content: 'text', tags: 'text' });
knowledgeBaseSchema.index({ slug: 1 });
knowledgeBaseSchema.index({ isFeatured: -1, isPinned: -1, createdAt: -1 });

// Virtual for like count
knowledgeBaseSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for bookmark count
knowledgeBaseSchema.virtual('bookmarkCount').get(function() {
  return this.bookmarks.length;
});

// Virtual for comment count
knowledgeBaseSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for average rating
knowledgeBaseSchema.virtual('rating').get(function() {
  if (this.totalRatings === 0) return 0;
  return this.averageRating;
});

// Pre-save middleware to generate slug
knowledgeBaseSchema.pre('save', function(next) {
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

// Instance method to add comment
knowledgeBaseSchema.methods.addComment = function(commentData) {
  this.comments.push(commentData);
  return this.save();
};

// Instance method to toggle like
knowledgeBaseSchema.methods.toggleLike = function(userId) {
  const likeIndex = this.likes.indexOf(userId);
  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
  } else {
    this.likes.push(userId);
  }
  return this.save();
};

// Instance method to toggle bookmark
knowledgeBaseSchema.methods.toggleBookmark = function(userId) {
  const bookmarkIndex = this.bookmarks.indexOf(userId);
  if (bookmarkIndex > -1) {
    this.bookmarks.splice(bookmarkIndex, 1);
  } else {
    this.bookmarks.push(userId);
  }
  return this.save();
};

// Instance method to add rating
knowledgeBaseSchema.methods.addRating = function(userId, rating, feedback = '') {
  // Remove existing rating if exists
  this.ratings = this.ratings.filter(r => r.user.toString() !== userId.toString());
  
  // Add new rating
  this.ratings.push({ user: userId, rating, feedback });
  
  // Calculate average rating
  const totalRating = this.ratings.reduce((sum, r) => sum + r.rating, 0);
  this.averageRating = Math.round((totalRating / this.ratings.length) * 10) / 10;
  this.totalRatings = this.ratings.length;
  
  return this.save();
};

// Instance method to increment views
knowledgeBaseSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static method to find articles by category
knowledgeBaseSchema.statics.findByCategory = function(category, limit = 20, skip = 0) {
  return this.find({ category, status: 'published' })
    .populate('author', 'firstName lastName name photoURL district state')
    .sort({ isPinned: -1, isFeatured: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to find trending articles
knowledgeBaseSchema.statics.findTrending = function(limit = 10) {
  return this.find({ 
    status: 'published',
    views: { $gt: 0 }
  })
    .populate('author', 'firstName lastName name photoURL district state')
    .sort({ views: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to find featured articles
knowledgeBaseSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ 
    status: 'published',
    isFeatured: true
  })
    .populate('author', 'firstName lastName name photoURL district state')
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to search articles
knowledgeBaseSchema.statics.searchArticles = function(query, filters = {}) {
  const searchQuery = {
    status: 'published',
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { content: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } },
      { keywords: { $in: [new RegExp(query, 'i')] } }
    ]
  };
  
  if (filters.category) {
    searchQuery.category = filters.category;
  }
  
  if (filters.difficulty) {
    searchQuery.difficulty = filters.difficulty;
  }
  
  if (filters.targetCrops && filters.targetCrops.length > 0) {
    searchQuery.targetCrops = { $in: filters.targetCrops };
  }
  
  if (filters.location) {
    searchQuery['targetRegions.district'] = new RegExp(filters.location, 'i');
  }
  
  return this.find(searchQuery)
    .populate('author', 'firstName lastName name photoURL district state')
    .sort({ isPinned: -1, isFeatured: -1, createdAt: -1 });
};

// Static method to find articles by slug
knowledgeBaseSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, status: 'published' })
    .populate('author', 'firstName lastName name photoURL district state')
    .populate('coAuthors', 'firstName lastName name photoURL');
};

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);






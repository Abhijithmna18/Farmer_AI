const mongoose = require('mongoose');

// Poll option schema
const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    maxlength: 200
  },
  votes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  image: { type: String } // Optional image for the option
}, { _id: true });

// Community poll schema
const communityPollSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Poll configuration
  type: {
    type: String,
    enum: ['single-choice', 'multiple-choice', 'rating', 'yes-no'],
    default: 'single-choice'
  },
  options: [pollOptionSchema],
  
  // Poll settings
  allowMultipleVotes: { type: Boolean, default: false },
  allowAnonymousVotes: { type: Boolean, default: true },
  showResultsBeforeEnd: { type: Boolean, default: true },
  allowVoteChange: { type: Boolean, default: true },
  
  // Poll timing
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  
  // Poll visibility and targeting
  visibility: {
    type: String,
    enum: ['public', 'group', 'private'],
    default: 'public'
  },
  targetGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityGroup'
  },
  targetCrops: [{
    type: String,
    trim: true
  }],
  targetLocation: {
    district: { type: String },
    state: { type: String }
  },
  
  // Poll categories
  category: {
    type: String,
    enum: [
      'general', 'farming-practices', 'market-trends', 'weather', 
      'pest-disease', 'irrigation', 'soil-health', 'technology',
      'government-schemes', 'equipment', 'organic-farming'
    ],
    default: 'general',
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Poll results and analytics
  totalVotes: { type: Number, default: 0 },
  uniqueVoters: { type: Number, default: 0 },
  results: {
    mostVotedOption: { type: String },
    voteDistribution: [{
      option: { type: String },
      votes: { type: Number },
      percentage: { type: Number }
    }],
    demographics: {
      byLocation: [{
        location: { type: String },
        votes: { type: Number }
      }],
      byCrop: [{
        crop: { type: String },
        votes: { type: Number }
      }],
      byExperience: [{
        experienceRange: { type: String },
        votes: { type: Number }
      }]
    }
  },
  
  // Poll engagement
  views: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  comments: [{
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
  
  // Poll status
  status: {
    type: String,
    enum: ['draft', 'active', 'ended', 'cancelled', 'archived'],
    default: 'active',
    index: true
  },
  
  // Moderation
  isFeatured: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  flaggedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: { type: String },
    flaggedAt: { type: Date, default: Date.now }
  }],
  
  // Poll settings
  settings: {
    requireLogin: { type: Boolean, default: true },
    maxVotesPerUser: { type: Number, default: 1 },
    allowComments: { type: Boolean, default: true },
    allowSharing: { type: Boolean, default: true }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
communityPollSchema.index({ category: 1, status: 1, createdAt: -1 });
communityPollSchema.index({ author: 1, createdAt: -1 });
communityPollSchema.index({ tags: 1 });
communityPollSchema.index({ 'targetCrops': 1 });
communityPollSchema.index({ 'targetLocation.district': 1, 'targetLocation.state': 1 });
communityPollSchema.index({ endDate: 1, isActive: 1 });

// Virtual for total votes
communityPollSchema.virtual('totalVoteCount').get(function() {
  return this.options.reduce((total, option) => total + option.votes.length, 0);
});

// Virtual for comment count
communityPollSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for days remaining
communityPollSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Instance method to vote on poll
communityPollSchema.methods.vote = function(userId, optionIds) {
  if (!this.isActive || this.status !== 'active') {
    throw new Error('Poll is not active');
  }
  
  if (this.endDate && new Date() > this.endDate) {
    throw new Error('Poll has ended');
  }
  
  // Check if user already voted (for single choice polls)
  if (this.type === 'single-choice' && !this.allowVoteChange) {
    const hasVoted = this.options.some(option => 
      option.votes.some(vote => vote.toString() === userId.toString())
    );
    if (hasVoted) {
      throw new Error('User has already voted');
    }
  }
  
  // Remove existing votes if vote change is allowed
  if (this.allowVoteChange) {
    this.options.forEach(option => {
      option.votes = option.votes.filter(vote => vote.toString() !== userId.toString());
    });
  }
  
  // Add new votes
  const optionIdArray = Array.isArray(optionIds) ? optionIds : [optionIds];
  optionIdArray.forEach(optionId => {
    const option = this.options.id(optionId);
    if (option && !option.votes.includes(userId)) {
      option.votes.push(userId);
    }
  });
  
  this.totalVotes = this.totalVoteCount;
  this.uniqueVoters = new Set(
    this.options.flatMap(option => option.votes.map(vote => vote.toString()))
  ).size;
  
  return this.save();
};

// Instance method to add comment
communityPollSchema.methods.addComment = function(commentData) {
  this.comments.push(commentData);
  return this.save();
};

// Instance method to calculate results
communityPollSchema.methods.calculateResults = function() {
  const totalVotes = this.totalVoteCount;
  if (totalVotes === 0) {
    this.results = {
      mostVotedOption: null,
      voteDistribution: [],
      demographics: { byLocation: [], byCrop: [], byExperience: [] }
    };
    return this.save();
  }
  
  const voteDistribution = this.options.map(option => ({
    option: option.text,
    votes: option.votes.length,
    percentage: Math.round((option.votes.length / totalVotes) * 100)
  }));
  
  const mostVotedOption = voteDistribution.reduce((max, current) => 
    current.votes > max.votes ? current : max
  ).option;
  
  this.results = {
    mostVotedOption,
    voteDistribution,
    demographics: this.results.demographics || { byLocation: [], byCrop: [], byExperience: [] }
  };
  
  return this.save();
};

// Instance method to end poll
communityPollSchema.methods.endPoll = function() {
  this.isActive = false;
  this.status = 'ended';
  this.endDate = new Date();
  return this.calculateResults();
};

// Static method to find active polls
communityPollSchema.statics.findActivePolls = function(filters = {}) {
  const query = {
    isActive: true,
    status: 'active',
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gt: new Date() } }
    ]
  };
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.targetCrops && filters.targetCrops.length > 0) {
    query.targetCrops = { $in: filters.targetCrops };
  }
  
  if (filters.location) {
    query['targetLocation.district'] = new RegExp(filters.location, 'i');
  }
  
  return this.find(query)
    .populate('author', 'firstName lastName name photoURL district state')
    .sort({ isPinned: -1, createdAt: -1 });
};

// Static method to find polls by category
communityPollSchema.statics.findByCategory = function(category, limit = 20, skip = 0) {
  return this.find({ category, status: 'active' })
    .populate('author', 'firstName lastName name photoURL district state')
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to search polls
communityPollSchema.statics.searchPolls = function(query, filters = {}) {
  const searchQuery = {
    status: 'active',
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  };
  
  if (filters.category) {
    searchQuery.category = filters.category;
  }
  
  if (filters.targetCrops && filters.targetCrops.length > 0) {
    searchQuery.targetCrops = { $in: filters.targetCrops };
  }
  
  return this.find(searchQuery)
    .populate('author', 'firstName lastName name photoURL district state')
    .sort({ isPinned: -1, createdAt: -1 });
};

module.exports = mongoose.model('CommunityPoll', communityPollSchema);






const mongoose = require('mongoose');

// Group member schema
const groupMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['member', 'moderator', 'admin'],
    default: 'member'
  },
  joinedAt: { type: Date, default: Date.now },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'muted', 'banned'],
    default: 'active'
  }
}, { _id: false });

// Group event schema
const groupEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxAttendees: { type: Number },
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

// Community group schema
const communityGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  type: {
    type: String,
    required: true,
    enum: ['location', 'crop', 'interest', 'general'],
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'paddy', 'rubber', 'coconut', 'vegetables', 'fruits', 'spices',
      'organic', 'irrigation', 'pest-control', 'soil-health',
      'thrissur', 'kuttanad', 'palakkad', 'wayanad', 'idukki',
      'technology', 'equipment', 'marketplace', 'general'
    ],
    index: true
  },
  
  // Group details
  coverImage: { type: String },
  profileImage: { type: String },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Location for location-based groups
  location: {
    district: { type: String },
    state: { type: String },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] } // [lng, lat]
    },
    radius: { type: Number, default: 50 } // in km
  },
  
  // Group settings
  visibility: {
    type: String,
    enum: ['public', 'private', 'invite-only'],
    default: 'public'
  },
  joinApproval: { type: Boolean, default: false },
  allowMemberPosts: { type: Boolean, default: true },
  allowMemberEvents: { type: Boolean, default: true },
  
  // Members and moderators
  members: [groupMemberSchema],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Group statistics
  stats: {
    memberCount: { type: Number, default: 0 },
    postCount: { type: Number, default: 0 },
    eventCount: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now }
  },
  
  // Group events
  events: [groupEventSchema],
  
  // Group rules and guidelines
  rules: [{
    title: { type: String, required: true },
    description: { type: String, required: true }
  }],
  
  // Group status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'archived'],
    default: 'active',
    index: true
  },
  
  // Moderation
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: { type: String },
    reportedAt: { type: Date, default: Date.now }
  }],
  
  // Group settings
  settings: {
    allowImageUploads: { type: Boolean, default: true },
    allowVideoUploads: { type: Boolean, default: true },
    allowExternalLinks: { type: Boolean, default: true },
    requireApprovalForPosts: { type: Boolean, default: false },
    maxPostLength: { type: Number, default: 5000 },
    maxImageUploads: { type: Number, default: 10 }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
communityGroupSchema.index({ type: 1, category: 1, status: 1 });
communityGroupSchema.index({ 'location.coordinates': '2dsphere' });
communityGroupSchema.index({ 'members.user': 1 });
communityGroupSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for member count
communityGroupSchema.virtual('memberCount').get(function() {
  return this.members.filter(member => member.status === 'active').length;
});

// Virtual for admin count
communityGroupSchema.virtual('adminCount').get(function() {
  return this.admins.length;
});

// Instance method to add member
communityGroupSchema.methods.addMember = function(userId, role = 'member', invitedBy = null) {
  const existingMember = this.members.find(member => member.user.toString() === userId.toString());
  if (existingMember) {
    return Promise.resolve(this);
  }
  
  this.members.push({
    user: userId,
    role: role,
    invitedBy: invitedBy
  });
  
  this.stats.memberCount = this.members.filter(member => member.status === 'active').length;
  return this.save();
};

// Instance method to remove member
communityGroupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => member.user.toString() !== userId.toString());
  this.stats.memberCount = this.members.filter(member => member.status === 'active').length;
  return this.save();
};

// Instance method to promote member to moderator
communityGroupSchema.methods.promoteToModerator = function(userId) {
  const member = this.members.find(member => member.user.toString() === userId.toString());
  if (member) {
    member.role = 'moderator';
  }
  return this.save();
};

// Instance method to check if user is member
communityGroupSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString() && member.status === 'active'
  );
};

// Instance method to check if user is admin
communityGroupSchema.methods.isAdmin = function(userId) {
  return this.admins.some(admin => admin.toString() === userId.toString());
};

// Instance method to check if user is moderator
communityGroupSchema.methods.isModerator = function(userId) {
  return this.moderators.some(mod => mod.toString() === userId.toString()) ||
         this.members.some(member => 
           member.user.toString() === userId.toString() && member.role === 'moderator'
         );
};

// Static method to find groups by location
communityGroupSchema.statics.findByLocation = function(coordinates, maxDistance = 50) {
  return this.find({
    type: 'location',
    status: 'active',
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    }
  });
};

// Static method to find groups by crop
communityGroupSchema.statics.findByCrop = function(crop) {
  return this.find({
    type: 'crop',
    category: crop,
    status: 'active'
  });
};

// Static method to search groups
communityGroupSchema.statics.searchGroups = function(query, filters = {}) {
  const searchQuery = {
    status: 'active',
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  };
  
  if (filters.type) {
    searchQuery.type = filters.type;
  }
  
  if (filters.category) {
    searchQuery.category = filters.category;
  }
  
  if (filters.visibility) {
    searchQuery.visibility = filters.visibility;
  }
  
  return this.find(searchQuery)
    .populate('createdBy', 'firstName lastName name photoURL')
    .sort({ 'stats.memberCount': -1, createdAt: -1 });
};

module.exports = mongoose.model('CommunityGroup', communityGroupSchema);






const mongoose = require('mongoose');

const AssistantHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['chat','insight'], default: 'chat', index: true },
  query: { type: String },
  reply: { type: String },
  language: { type: String, enum: ['en','hi','ml','ta'], default: 'en' },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = mongoose.model('AssistantHistory', AssistantHistorySchema);



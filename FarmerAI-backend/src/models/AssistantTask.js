const mongoose = require('mongoose');

const AssistantTaskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false, index: true },
    proTip: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AssistantTask', AssistantTaskSchema);

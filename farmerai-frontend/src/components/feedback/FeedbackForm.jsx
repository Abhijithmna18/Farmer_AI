import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle,
  Bug,
  Lightbulb,
  MessageSquare,
  FileText
} from 'lucide-react';
import Toast from '../Toast';
import apiClient from '../../services/apiClient';

const FeedbackForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'Bug Report',
    subject: '',
    description: '',
    priority: 'Medium'
  });
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const feedbackTypes = [
    { value: 'Bug Report', label: 'Bug Report', icon: Bug, color: 'text-red-600' },
    { value: 'Feature Suggestion', label: 'Feature Suggestion', icon: Lightbulb, color: 'text-yellow-600' },
    { value: 'General Comment', label: 'General Comment', icon: MessageSquare, color: 'text-blue-600' }
  ];

  const priorities = [
    { value: 'Low', label: 'Low', color: 'text-gray-600' },
    { value: 'Medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'High', label: 'High', color: 'text-orange-600' },
    { value: 'Critical', label: 'Critical', color: 'text-red-600' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setToast({ type: 'error', message: 'File size must be less than 10MB' });
        return;
      }
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.description.trim()) {
      setToast({ type: 'error', message: 'Subject and description are required' });
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('type', formData.type);
      submitData.append('subject', formData.subject);
      submitData.append('description', formData.description);
      submitData.append('priority', formData.priority);
      
      if (attachment) {
        submitData.append('attachment', attachment);
      }

      const response = await apiClient.post('/feedback', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setToast({ type: 'success', message: 'Feedback submitted successfully!' });
      
      // Reset form
      setFormData({
        type: 'Bug Report',
        subject: '',
        description: '',
        priority: 'Medium'
      });
      setAttachment(null);
      
      if (onSuccess) {
        onSuccess(response.data.feedback);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setToast({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to submit feedback' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-2 border-green-100 p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Submit Feedback</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Feedback Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Feedback Type *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {feedbackTypes.map((type) => {
              const Icon = type.icon;
              return (
                <label
                  key={type.value}
                  className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
                    formData.type === type.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${type.color}`} />
                    <span className="font-medium text-gray-800">{type.label}</span>
                  </div>
                  {formData.type === type.value && (
                    <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-green-600" />
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
          >
            {priorities.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject *
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            placeholder="Brief description of your feedback"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="6"
            placeholder="Please provide detailed information about your feedback..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
            required
          />
        </div>

        {/* Attachment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachment (Optional)
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg cursor-pointer hover:bg-green-100 transition">
                <Upload className="w-4 h-4" />
                <span>Choose File</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-sm text-gray-500">
                Images and PDF files only (max 10MB)
              </span>
            </div>
            
            {attachment && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-800">{attachment.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="p-1 hover:bg-gray-200 rounded transition"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{loading ? 'Submitting...' : 'Submit Feedback'}</span>
          </button>
        </div>
      </form>

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </motion.div>
  );
};

export default FeedbackForm;




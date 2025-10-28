import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle,
  Bug,
  Lightbulb,
  MessageSquare,
  FileText,
  Eye,
  EyeOff,
  Clock,
  Star,
  Zap,
  Shield,
  Info,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Loader2,
  Camera,
  Image as ImageIcon,
  File,
  Trash2,
  Plus,
  Minus,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import Toast from '../Toast';
import apiClient from '../../services/apiClient';

const FeedbackForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'Bug Report',
    subject: '',
    description: '',
    priority: 'Medium',
    category: '',
    tags: [],
    contactPreference: 'email',
    allowFollowUp: true,
    urgency: 'normal'
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);

  const feedbackTypes = [
    { 
      value: 'Bug Report', 
      label: 'Bug Report', 
      icon: Bug, 
      color: 'text-red-600',
      description: 'Report a bug or technical issue',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    { 
      value: 'Feature Suggestion', 
      label: 'Feature Suggestion', 
      icon: Lightbulb, 
      color: 'text-yellow-600',
      description: 'Suggest a new feature or improvement',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    { 
      value: 'General Comment', 
      label: 'General Comment', 
      icon: MessageSquare, 
      color: 'text-blue-600',
      description: 'Share general feedback or thoughts',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      value: 'Performance Issue', 
      label: 'Performance Issue', 
      icon: Zap, 
      color: 'text-purple-600',
      description: 'Report slow performance or optimization needs',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    { 
      value: 'Security Concern', 
      label: 'Security Concern', 
      icon: Shield, 
      color: 'text-orange-600',
      description: 'Report security vulnerabilities or concerns',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];

  const priorities = [
    { value: 'Low', label: 'Low', color: 'text-gray-600', icon: Clock, description: 'Can be addressed in future updates' },
    { value: 'Medium', label: 'Medium', color: 'text-yellow-600', icon: Star, description: 'Standard priority for normal issues' },
    { value: 'High', label: 'High', color: 'text-orange-600', icon: AlertTriangle, description: 'Important issue affecting functionality' },
    { value: 'Critical', label: 'Critical', color: 'text-red-600', icon: AlertCircle, description: 'Urgent issue requiring immediate attention' }
  ];

  const categories = [
    'User Interface',
    'Performance',
    'Security',
    'Mobile App',
    'Web Platform',
    'API',
    'Database',
    'Authentication',
    'Payment System',
    'Notifications',
    'Other'
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low', color: 'text-green-600', description: 'No rush, whenever convenient' },
    { value: 'normal', label: 'Normal', color: 'text-blue-600', description: 'Standard response time expected' },
    { value: 'high', label: 'High', color: 'text-orange-600', description: 'Please prioritize this feedback' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600', description: 'Critical issue requiring immediate attention' }
  ];

  const contactPreferences = [
    { value: 'email', label: 'Email', icon: MessageSquare, description: 'Receive updates via email' },
    { value: 'in-app', label: 'In-App', icon: Bell, description: 'Get notifications within the app' },
    { value: 'both', label: 'Both', icon: CheckCircle2, description: 'Email and in-app notifications' }
  ];

  // Validation functions
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'subject':
        if (!value.trim()) {
          newErrors.subject = 'Subject is required';
        } else if (value.trim().length < 5) {
          newErrors.subject = 'Subject must be at least 5 characters';
        } else if (value.trim().length > 200) {
          newErrors.subject = 'Subject must be less than 200 characters';
        } else {
          delete newErrors.subject;
        }
        break;
        
      case 'description':
        if (!value.trim()) {
          newErrors.description = 'Description is required';
        } else if (value.trim().length < 20) {
          newErrors.description = 'Description must be at least 20 characters';
        } else if (value.trim().length > 2000) {
          newErrors.description = 'Description must be less than 2000 characters';
        } else {
          delete newErrors.description;
        }
        break;
        
      case 'category':
        if (!value) {
          newErrors.category = 'Please select a category';
        } else {
          delete newErrors.category;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    } else if (formData.subject.trim().length > 200) {
      newErrors.subject = 'Subject must be less than 200 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    } else if (formData.description.trim().length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    // File validation
    if (attachments.length > 5) {
      newErrors.attachments = 'Maximum 5 files allowed';
    }
    
    const totalSize = attachments.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 50 * 1024 * 1024) { // 50MB total limit
      newErrors.attachments = 'Total file size must be less than 50MB';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Real-time validation
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  // Enhanced file handling
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = [...attachments];
    
    files.forEach(file => {
      // File type validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        setToast({ type: 'error', message: `${file.name} is not a supported file type` });
        return;
      }
      
      // File size validation
      if (file.size > 10 * 1024 * 1024) { // 10MB per file
        setToast({ type: 'error', message: `${file.name} is too large. Maximum size is 10MB` });
        return;
      }
      
      // Total files limit
      if (newAttachments.length >= 5) {
        setToast({ type: 'error', message: 'Maximum 5 files allowed' });
        return;
      }
      
      // Total size validation
      const totalSize = newAttachments.reduce((sum, f) => sum + f.size, 0) + file.size;
      if (totalSize > 50 * 1024 * 1024) { // 50MB total
        setToast({ type: 'error', message: 'Total file size exceeds 50MB limit' });
        return;
      }
      
      newAttachments.push({
        file,
        id: Date.now() + Math.random(),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      });
    });
    
    setAttachments(newAttachments);
    e.target.value = ''; // Reset file input
  };

  const removeAttachment = (id) => {
    setAttachments(prev => {
      const updated = prev.filter(att => att.id !== id);
      // Clean up object URLs
      const removed = prev.find(att => att.id === id);
      if (removed && removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  // Tag management
  const addTag = (tag) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(e.target.value);
      e.target.value = '';
    }
  };

  // Step navigation
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Form progress calculation
  const getFormProgress = () => {
    let progress = 0;
    const totalFields = 6; // type, subject, description, category, priority, urgency
    
    if (formData.type) progress += 1;
    if (formData.subject.trim()) progress += 1;
    if (formData.description.trim()) progress += 1;
    if (formData.category) progress += 1;
    if (formData.priority) progress += 1;
    if (formData.urgency) progress += 1;
    
    return (progress / totalFields) * 100;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched for validation
    setTouched({
      subject: true,
      description: true,
      category: true
    });
    
    // Validate form
    if (!validateForm()) {
      setToast({ type: 'error', message: 'Please fix the errors before submitting' });
      return;
    }

    setIsValidating(true);
    setValidationProgress(0);
    
    // Simulate validation progress
    const progressInterval = setInterval(() => {
      setValidationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('type', formData.type);
      submitData.append('subject', formData.subject);
      submitData.append('description', formData.description);
      submitData.append('priority', formData.priority);
      submitData.append('category', formData.category);
      submitData.append('urgency', formData.urgency);
      submitData.append('contactPreference', formData.contactPreference);
      submitData.append('allowFollowUp', formData.allowFollowUp);
      submitData.append('tags', JSON.stringify(formData.tags));
      
      // Add attachments
      attachments.forEach((attachment, index) => {
        submitData.append(`attachment_${index}`, attachment.file);
      });

      const response = await apiClient.post('/feedback', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setValidationProgress(100);
      setToast({ type: 'success', message: 'Feedback submitted successfully! We\'ll get back to you soon.' });
      
      // Reset form
      setFormData({
        type: 'Bug Report',
        subject: '',
        description: '',
        priority: 'Medium',
        category: '',
        tags: [],
        contactPreference: 'email',
        allowFollowUp: true,
        urgency: 'normal'
      });
      setAttachments([]);
      setErrors({});
      setTouched({});
      setCurrentStep(1);
      
      if (onSuccess) {
        onSuccess(response.data.feedback);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setToast({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to submit feedback. Please try again.' 
      });
    } finally {
      setLoading(false);
      setIsValidating(false);
      setValidationProgress(0);
      clearInterval(progressInterval);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-2 border-green-100 shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Submit Feedback</h3>
            <p className="text-green-100 mt-1">Help us improve by sharing your thoughts</p>
          </div>
        {onCancel && (
          <button
            onClick={onCancel}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
          >
              <X className="w-6 h-6" />
          </button>
        )}
      </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-green-100 mb-2">
            <span>Form Progress</span>
            <span>{Math.round(getFormProgress())}%</span>
          </div>
          <div className="w-full bg-green-800 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${getFormProgress()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= step 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    currentStep > step ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            Step {currentStep} of 3
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
        {/* Feedback Type */}
        <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  What type of feedback are you sharing? *
          </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feedbackTypes.map((type) => {
              const Icon = type.icon;
              return (
                <label
                  key={type.value}
                        className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.type === type.value
                            ? `${type.bgColor} ${type.borderColor} border-opacity-100`
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`w-6 h-6 ${type.color}`} />
                  {formData.type === type.value && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-1">{type.label}</h4>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                </label>
              );
            })}
          </div>
        </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.category}
                  </p>
                )}
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
                  onBlur={handleBlur}
                  placeholder="Brief description of your feedback"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 ${
                    errors.subject ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.subject ? (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.subject}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {formData.subject.length}/200 characters
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Detailed Information */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  rows="8"
                  placeholder="Please provide detailed information about your feedback. Include steps to reproduce if it's a bug, or explain your feature suggestion in detail..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 resize-none ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.description ? (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.description}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {formData.description.length}/2000 characters
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (Optional)
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Add tags to help categorize your feedback (press Enter to add)"
                    onKeyPress={handleTagKeyPress}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  />
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 hover:text-green-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Priority and Urgency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
          </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  >
                    {urgencyLevels.map((urgency) => (
                      <option key={urgency.value} value={urgency.value}>
                        {urgency.label}
                      </option>
                    ))}
                  </select>
        </div>
        </div>
            </motion.div>
          )}

          {/* Step 3: Attachments and Preferences */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments (Optional)
          </label>
                <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg cursor-pointer hover:bg-green-100 transition">
                <Upload className="w-4 h-4" />
                      <span>Choose Files</span>
                <input
                  type="file"
                        accept="image/*,.pdf,.txt"
                        multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-sm text-gray-500">
                      Images, PDF, and text files (max 5 files, 10MB each)
              </span>
            </div>
            
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {attachment.preview ? (
                              <img 
                                src={attachment.preview} 
                                alt="Preview" 
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <FileText className="w-10 h-10 text-gray-400" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-800">{attachment.file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(attachment.id)}
                            className="p-1 hover:bg-gray-200 rounded transition"
                          >
                            <Trash2 className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {errors.attachments && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.attachments}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Preferences */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How would you like to receive updates?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {contactPreferences.map((pref) => {
                    const Icon = pref.icon;
                    return (
                      <label
                        key={pref.value}
                        className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
                          formData.contactPreference === pref.value
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="contactPreference"
                          value={pref.value}
                          checked={formData.contactPreference === pref.value}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5 text-green-600" />
                          <div>
                            <span className="font-medium text-gray-800">{pref.label}</span>
                            <p className="text-xs text-gray-600">{pref.description}</p>
                          </div>
                        </div>
                        {formData.contactPreference === pref.value && (
                          <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-green-600" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Follow-up Permission */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="allowFollowUp"
                  name="allowFollowUp"
                  checked={formData.allowFollowUp}
                  onChange={(e) => setFormData(prev => ({ ...prev, allowFollowUp: e.target.checked }))}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="allowFollowUp" className="text-sm text-gray-700">
                  Allow our team to follow up with additional questions about your feedback
                </label>
              </div>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center space-x-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                >
                  Previous
                </button>
            )}
        </div>

            <div className="flex items-center space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition"
            >
              Cancel
            </button>
          )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Next
                </button>
              ) : (
          <button
            type="submit"
                  disabled={loading || isValidating}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60"
          >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating...</span>
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
              <Send className="w-4 h-4" />
                      <span>Submit Feedback</span>
                    </>
            )}
          </button>
              )}
            </div>
        </div>
      </form>

        {/* Validation Progress */}
        {isValidating && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">Validating your feedback...</p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${validationProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </motion.div>
  );
};

export default FeedbackForm;




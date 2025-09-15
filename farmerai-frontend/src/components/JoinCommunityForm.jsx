import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Upload, 
  User, 
  Mail, 
  MapPin, 
  Sprout, 
  Calendar,
  Camera,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import Toast from './Toast';
import apiClient from '../services/apiClient';

const JoinCommunityForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    district: '',
    state: '',
    crops: [],
    yearsOfExperience: '',
    profilePhoto: null,
    phone: '',
    bio: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [cropInput, setCropInput] = useState('');
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        setToast({ type: 'error', message: 'Please upload a valid image file (JPEG, PNG)' });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToast({ type: 'error', message: 'Image size should be less than 5MB' });
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        profilePhoto: file
      }));
    }
  };

  const handleCropAdd = () => {
    if (cropInput.trim() && !formData.crops.includes(cropInput.trim())) {
      setFormData(prev => ({
        ...prev,
        crops: [...prev.crops, cropInput.trim()]
      }));
      setCropInput('');
    }
  };

  const handleCropRemove = (cropToRemove) => {
    setFormData(prev => ({
      ...prev,
      crops: prev.crops.filter(crop => crop !== cropToRemove)
    }));
  };

  const handleCropKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCropAdd();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.district.trim()) {
      newErrors.district = 'District is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.yearsOfExperience) {
      newErrors.yearsOfExperience = 'Years of experience is required';
    } else if (formData.yearsOfExperience < 0 || formData.yearsOfExperience > 100) {
      newErrors.yearsOfExperience = 'Please enter a valid number of years';
    }
    
    if (formData.crops.length === 0) {
      newErrors.crops = 'Please add at least one crop you grow';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setToast({ type: 'error', message: 'Please fix the errors below' });
      return;
    }
    
    setLoading(true);
    
    try {
      const submitData = new FormData();
      submitData.append('fullName', formData.fullName.trim());
      submitData.append('email', formData.email.trim());
      submitData.append('district', formData.district.trim());
      submitData.append('state', formData.state.trim());
      submitData.append('crops', JSON.stringify(formData.crops));
      submitData.append('yearsOfExperience', formData.yearsOfExperience);
      submitData.append('phone', formData.phone.trim());
      submitData.append('bio', formData.bio.trim());
      
      if (formData.profilePhoto) {
        submitData.append('profilePhoto', formData.profilePhoto);
      }
      
      // Create a separate axios instance for join request (no auth required)
      const joinRequestClient = axios.create({
        baseURL: apiClient.defaults.baseURL,
        timeout: 30000
      });
      
      const response = await joinRequestClient.post('/community/join-request', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setToast({ type: 'success', message: 'Join request submitted successfully! You will receive an email confirmation once approved.' });
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        district: '',
        state: '',
        crops: [],
        yearsOfExperience: '',
        profilePhoto: null,
        phone: '',
        bio: ''
      });
      setCropInput('');
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting join request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit join request. Please try again.';
      setToast({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Join FarmerAI Community</h2>
              <p className="text-gray-600 mt-1">Connect with fellow farmers and share your knowledge</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <User className="w-5 h-5 mr-2 text-green-600" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition ${
                      errors.fullName 
                        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-400/30' 
                        : 'border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-400/30' 
                        : 'border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30'
                    }`}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition ${
                      errors.district 
                        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-400/30' 
                        : 'border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30'
                    }`}
                    placeholder="Enter your district"
                  />
                  {errors.district && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.district}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition ${
                      errors.state 
                        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-400/30' 
                        : 'border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30'
                    }`}
                    placeholder="Enter your state"
                  />
                  {errors.state && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.state}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 transition"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Farming Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Sprout className="w-5 h-5 mr-2 text-green-600" />
                Farming Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition ${
                    errors.yearsOfExperience 
                      ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-400/30' 
                      : 'border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30'
                  }`}
                  placeholder="Enter years of farming experience"
                />
                {errors.yearsOfExperience && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.yearsOfExperience}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crops Grown *
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={cropInput}
                    onChange={(e) => setCropInput(e.target.value)}
                    onKeyPress={handleCropKeyPress}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 transition"
                    placeholder="Type a crop and press Enter"
                  />
                  <button
                    type="button"
                    onClick={handleCropAdd}
                    className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                  >
                    Add
                  </button>
                </div>
                
                {formData.crops.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.crops.map((crop, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center"
                      >
                        {crop}
                        <button
                          type="button"
                          onClick={() => handleCropRemove(crop)}
                          className="ml-2 text-green-700 hover:text-green-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {errors.crops && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.crops}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio (Optional)
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 transition"
                  placeholder="Tell us about your farming journey..."
                />
              </div>
            </div>

            {/* Profile Photo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-green-600" />
                Profile Photo (Optional)
              </h3>
              
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                  {formData.profilePhoto ? (
                    <img
                      src={URL.createObjectURL(formData.profilePhoto)}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                  </button>
                  <p className="text-sm text-gray-600 mt-1">
                    JPEG, PNG (max 5MB)
                  </p>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
      
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  );
};

export default JoinCommunityForm;

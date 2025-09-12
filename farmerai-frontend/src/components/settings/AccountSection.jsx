import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Save, Send, CheckCircle } from 'lucide-react';
import { updateProfile } from '../../services/settingsService';

export default function AccountSection({ user, setUser, loading, setLoading, showToast }) {
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    name: user?.name || '',
    email: user?.email || '',
    photoURL: user?.photoURL || ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await updateProfile(profileData);
      
      // Update user context
      setUser({ ...user, ...response.user });
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to update profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (profileData.email === user?.email) return;
    
    setLoading(true);
    try {
      // Simulate sending verification email
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('Verification email sent! Please check your inbox.', 'success');
    } catch (error) {
      showToast('Failed to send verification email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Account Information</h2>
      
      <form onSubmit={handleProfileUpdate} className="space-y-6">
        {/* Profile Picture */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <img
              src={profileData.photoURL || '/vite.svg'}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-4 border-green-200 dark:border-green-700"
            />
            <button
              type="button"
              className="absolute -bottom-2 -right-2 bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {profileData.firstName && profileData.lastName ? `${profileData.firstName} ${profileData.lastName}` : profileData.name || 'User Name'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{profileData.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">Email Verified</span>
            </div>
          </div>
        </div>

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            First Name
          </label>
          <input
            type="text"
            value={profileData.firstName}
            onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            placeholder="Enter your first name"
            pattern="[A-Za-z]{2,}"
            title="First name must contain only letters and be at least 2 characters"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Last Name
          </label>
          <input
            type="text"
            value={profileData.lastName}
            onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            placeholder="Enter your last name"
            pattern="[A-Za-z]{2,}"
            title="Last name must contain only letters and be at least 2 characters"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              placeholder="Enter your email"
            />
            <button
              type="button"
              onClick={handleEmailChange}
              disabled={loading || profileData.email === user?.email}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Verify
            </button>
          </div>
          {profileData.email !== user?.email && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              A verification email will be sent to confirm your new email address.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </motion.div>
  );
}

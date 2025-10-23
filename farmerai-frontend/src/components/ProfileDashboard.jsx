import React, { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import { 
  fetchProfile, 
  updateProfile, 
  getUserStats, 
  getActivityFeed,
  updateFarmerProfile,
  updateBuyerProfile,
  updateWarehouseOwnerProfile,
  becomeWarehouseOwner,
  uploadVerificationDocument
} from '../services/profileService';
import { 
  getPreferences, 
  updatePreferences,
  getNotificationPreferences,
  updateNotificationPreferences,
  getLoginHistory,
  changePassword
} from '../services/settingsService';
import Toast from './Toast';
import HomeButton from './HomeButton';
import PageHeader from './PageHeader';
import Section from './Section';

export default function ProfileDashboard() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    phone: '',
    location: '',
    state: '',
    district: '',
    pincode: '',
    soilType: 'Loamy',
    crops: [],
    language: 'English'
  });
  
  const [farmerForm, setFarmerForm] = useState({
    farmName: '',
    farmSize: '',
    farmingExperience: '',
    certifications: [],
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountHolderName: ''
    }
  });
  
  const [buyerForm, setBuyerForm] = useState({
    addresses: [],
    paymentMethods: [],
    preferences: {
      preferredCategories: [],
      maxDeliveryDistance: 50,
      organicPreference: false,
      localPreference: true
    }
  });
  
  const [warehouseForm, setWarehouseForm] = useState({
    businessName: '',
    businessType: 'individual',
    gstNumber: '',
    panNumber: '',
    businessAddress: {
      address: '',
      city: '',
      state: '',
      pincode: ''
    },
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountHolderName: ''
    }
  });

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load all profile data in parallel
      const [
        profileData,
        statsData,
        activitiesData,
        preferencesData,
        notificationsData,
        loginHistoryData
      ] = await Promise.all([
        fetchProfile(),
        getUserStats(),
        getActivityFeed(),
        getPreferences(),
        getNotificationPreferences(),
        getLoginHistory()
      ]);

      // Update profile form
      setProfileForm(prev => ({
        ...prev,
        firstName: profileData.firstName || user.firstName || '',
        lastName: profileData.lastName || user.lastName || '',
        name: profileData.name || user.name || '',
        email: profileData.email || user.email || '',
        phone: profileData.phone || '',
        location: profileData.location || '',
        state: profileData.state || '',
        district: profileData.district || '',
        pincode: profileData.pincode || '',
        soilType: profileData.soilType || 'Loamy',
        crops: profileData.crops || [],
        language: profileData.language || 'English'
      }));

      // Update farmer form if farmer profile exists
      if (profileData.farmerProfile) {
        setFarmerForm(prev => ({
          ...prev,
          farmName: profileData.farmerProfile.farmName || '',
          farmSize: profileData.farmerProfile.farmSize || '',
          farmingExperience: profileData.farmerProfile.farmingExperience || '',
          certifications: profileData.farmerProfile.certifications || [],
          bankDetails: profileData.farmerProfile.bankDetails || prev.bankDetails
        }));
      }

      // Update buyer form if buyer profile exists
      if (profileData.buyerProfile) {
        setBuyerForm(prev => ({
          ...prev,
          addresses: profileData.buyerProfile.addresses || [],
          paymentMethods: profileData.buyerProfile.paymentMethods || [],
          preferences: profileData.buyerProfile.preferences || prev.preferences
        }));
      }

      // Update warehouse form if warehouse profile exists
      if (profileData.warehouseOwnerProfile) {
        setWarehouseForm(prev => ({
          ...prev,
          businessName: profileData.warehouseOwnerProfile.businessName || '',
          businessType: profileData.warehouseOwnerProfile.businessType || 'individual',
          gstNumber: profileData.warehouseOwnerProfile.gstNumber || '',
          panNumber: profileData.warehouseOwnerProfile.panNumber || '',
          businessAddress: profileData.warehouseOwnerProfile.businessAddress || prev.businessAddress,
          bankDetails: profileData.warehouseOwnerProfile.bankDetails || prev.bankDetails
        }));
      }

      setStats(statsData.stats);
      setActivities(activitiesData.activities);
      setPreferences(preferencesData.preferences);
      setNotifications(notificationsData.notifications);
      setLoginHistory(loginHistoryData.loginHistory);
      
    } catch (error) {
      console.error('Error loading profile data:', error);
      setToast({ type: 'error', message: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const updated = await updateProfile(profileForm);
      setUser(prev => ({ ...prev, ...updated }));
      setToast({ type: 'success', message: 'Profile updated successfully' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleFarmerUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateFarmerProfile(farmerForm);
      setToast({ type: 'success', message: 'Farmer profile updated successfully' });
      loadProfileData(); // Reload to get updated stats
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to update farmer profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyerUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateBuyerProfile(buyerForm);
      setToast({ type: 'success', message: 'Buyer profile updated successfully' });
      loadProfileData(); // Reload to get updated stats
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to update buyer profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateWarehouseOwnerProfile(warehouseForm);
      setToast({ type: 'success', message: 'Warehouse owner profile updated successfully' });
      loadProfileData(); // Reload to get updated stats
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to update warehouse profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeWarehouseOwner = async () => {
    if (!confirm('Are you sure you want to become a warehouse owner? This will change your account type.')) {
      return;
    }
    
    setLoading(true);
    try {
      await becomeWarehouseOwner();
      setToast({ type: 'success', message: 'Successfully upgraded to warehouse owner!' });
      loadProfileData(); // Reload to get updated data
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to upgrade account' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'farmer', label: 'Farmer', icon: '🚜' },
    { id: 'buyer', label: 'Buyer', icon: '🛒' },
    { id: 'warehouse', label: 'Warehouse', icon: '🏢' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'activity', label: 'Activity', icon: '📈' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Account Age</p>
              <p className="text-2xl font-bold text-gray-800">{stats?.accountAge || 0} days</p>
            </div>
            <div className="text-3xl">📅</div>
          </div>
        </div>
        
        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-blue-100 shadow-[0_25px_60px_-15px_rgba(59,130,246,0.18)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">User Type</p>
              <p className="text-2xl font-bold text-gray-800 capitalize">{stats?.userType || 'Farmer'}</p>
            </div>
            <div className="text-3xl">👤</div>
          </div>
        </div>
        
        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-purple-100 shadow-[0_25px_60px_-15px_rgba(147,51,234,0.18)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verification</p>
              <p className="text-2xl font-bold text-gray-800 capitalize">{stats?.verificationStatus || 'Unverified'}</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
      </div>

      {/* Farmer Stats */}
      {stats?.farmerStats && (
        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Farmer Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.farmerStats.farmSize || 0}</p>
              <p className="text-sm text-gray-600">Acres</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.farmerStats.farmingExperience || 0}</p>
              <p className="text-sm text-gray-600">Years Experience</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.farmerStats.totalSales || 0}</p>
              <p className="text-sm text-gray-600">Total Sales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.farmerStats.rating?.average || 0}</p>
              <p className="text-sm text-gray-600">Rating</p>
            </div>
          </div>
        </div>
      )}

      {/* Buyer Stats */}
      {stats?.buyerStats && (
        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-blue-100 shadow-[0_25px_60px_-15px_rgba(59,130,246,0.18)]">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Buyer Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.buyerStats.totalPurchases || 0}</p>
              <p className="text-sm text-gray-600">Total Purchases</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.buyerStats.addressesCount || 0}</p>
              <p className="text-sm text-gray-600">Addresses</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.buyerStats.paymentMethodsCount || 0}</p>
              <p className="text-sm text-gray-600">Payment Methods</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.buyerStats.rating?.average || 0}</p>
              <p className="text-sm text-gray-600">Rating</p>
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Stats */}
      {stats?.warehouseStats && (
        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-purple-100 shadow-[0_25px_60px_-15px_rgba(147,51,234,0.18)]">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Warehouse Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.warehouseStats.totalBookings || 0}</p>
              <p className="text-sm text-gray-600">Total Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">₹{stats.warehouseStats.totalRevenue || 0}</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.warehouseStats.rating?.average || 0}</p>
              <p className="text-sm text-gray-600">Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600 capitalize">{stats.warehouseStats.verificationStatus || 'Unverified'}</p>
              <p className="text-sm text-gray-600">Status</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <form onSubmit={handleProfileUpdate} className="space-y-6">
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={profileForm.firstName}
              onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              value={profileForm.lastName}
              onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={profileForm.email}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Location Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={profileForm.location}
              onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              value={profileForm.state}
              onChange={(e) => setProfileForm(prev => ({ ...prev, state: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
            <input
              type="text"
              value={profileForm.district}
              onChange={(e) => setProfileForm(prev => ({ ...prev, district: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
            <input
              type="text"
              value={profileForm.pincode}
              onChange={(e) => setProfileForm(prev => ({ ...prev, pincode: e.target.value.replace(/[^\d]/g, "").slice(0,6) }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Farm Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
            <select
              value={profileForm.soilType}
              onChange={(e) => setProfileForm(prev => ({ ...prev, soilType: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              disabled={loading}
            >
              <option value="Loamy">Loamy</option>
              <option value="Sandy">Sandy</option>
              <option value="Clay">Clay</option>
              <option value="Silty">Silty</option>
              <option value="Peaty">Peaty</option>
              <option value="Chalky">Chalky</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select
              value={profileForm.language}
              onChange={(e) => setProfileForm(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              disabled={loading}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Kannada">Kannada</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </div>
    </form>
  );

  const renderFarmer = () => (
    <form onSubmit={handleFarmerUpdate} className="space-y-6">
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Farm Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
            <input
              type="text"
              value={farmerForm.farmName}
              onChange={(e) => setFarmerForm(prev => ({ ...prev, farmName: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farm Size (Acres)</label>
            <input
              type="number"
              value={farmerForm.farmSize}
              onChange={(e) => setFarmerForm(prev => ({ ...prev, farmSize: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farming Experience (Years)</label>
            <input
              type="number"
              value={farmerForm.farmingExperience}
              onChange={(e) => setFarmerForm(prev => ({ ...prev, farmingExperience: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Bank Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
            <input
              type="text"
              value={farmerForm.bankDetails.accountNumber}
              onChange={(e) => setFarmerForm(prev => ({ 
                ...prev, 
                bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
              }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
            <input
              type="text"
              value={farmerForm.bankDetails.ifscCode}
              onChange={(e) => setFarmerForm(prev => ({ 
                ...prev, 
                bankDetails: { ...prev.bankDetails, ifscCode: e.target.value }
              }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
            <input
              type="text"
              value={farmerForm.bankDetails.bankName}
              onChange={(e) => setFarmerForm(prev => ({ 
                ...prev, 
                bankDetails: { ...prev.bankDetails, bankName: e.target.value }
              }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
            <input
              type="text"
              value={farmerForm.bankDetails.accountHolderName}
              onChange={(e) => setFarmerForm(prev => ({ 
                ...prev, 
                bankDetails: { ...prev.bankDetails, accountHolderName: e.target.value }
              }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Farmer Profile'}
        </button>
      </div>
    </form>
  );

  const renderBuyer = () => (
    <form onSubmit={handleBuyerUpdate} className="space-y-6">
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-blue-100 shadow-[0_25px_60px_-15px_rgba(59,130,246,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Buyer Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Delivery Distance (km)</label>
            <input
              type="number"
              value={buyerForm.preferences.maxDeliveryDistance}
              onChange={(e) => setBuyerForm(prev => ({ 
                ...prev, 
                preferences: { ...prev.preferences, maxDeliveryDistance: parseInt(e.target.value) }
              }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-blue-100 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
              disabled={loading}
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={buyerForm.preferences.organicPreference}
                onChange={(e) => setBuyerForm(prev => ({ 
                  ...prev, 
                  preferences: { ...prev.preferences, organicPreference: e.target.checked }
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <span className="ml-2 text-sm text-gray-700">Prefer Organic Products</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={buyerForm.preferences.localPreference}
                onChange={(e) => setBuyerForm(prev => ({ 
                  ...prev, 
                  preferences: { ...prev.preferences, localPreference: e.target.checked }
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <span className="ml-2 text-sm text-gray-700">Prefer Local Products</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Buyer Profile'}
        </button>
      </div>
    </form>
  );

  const renderWarehouse = () => (
    <div className="space-y-6">
      {stats?.userType !== 'warehouse-owner' && (
        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-purple-100 shadow-[0_25px_60px_-15px_rgba(147,51,234,0.18)]">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Become a Warehouse Owner</h3>
          <p className="text-gray-600 mb-4">Upgrade your account to become a warehouse owner and start earning from storage bookings.</p>
          <button
            onClick={handleBecomeWarehouseOwner}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Upgrading...' : 'Become Warehouse Owner'}
          </button>
        </div>
      )}

      {stats?.userType === 'warehouse-owner' && (
        <form onSubmit={handleWarehouseUpdate} className="space-y-6">
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-purple-100 shadow-[0_25px_60px_-15px_rgba(147,51,234,0.18)]">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={warehouseForm.businessName}
                  onChange={(e) => setWarehouseForm(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-purple-100 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                <select
                  value={warehouseForm.businessType}
                  onChange={(e) => setWarehouseForm(prev => ({ ...prev, businessType: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-purple-100 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30"
                  disabled={loading}
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                  <option value="partnership">Partnership</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                <input
                  type="text"
                  value={warehouseForm.gstNumber}
                  onChange={(e) => setWarehouseForm(prev => ({ ...prev, gstNumber: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-purple-100 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  value={warehouseForm.panNumber}
                  onChange={(e) => setWarehouseForm(prev => ({ ...prev, panNumber: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-purple-100 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Warehouse Profile'}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl">{activity.icon}</div>
              <div className="flex-1">
                <p className="text-gray-800 font-medium">{activity.message}</p>
                <p className="text-sm text-gray-600">{new Date(activity.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Preferences</h3>
        {preferences && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="kn">Kannada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select
                value={preferences.theme}
                onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-red-100 shadow-[0_25px_60px_-15px_rgba(239,68,68,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Login History</h3>
        <div className="space-y-3">
          {loginHistory.slice(0, 5).map((login, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800">{login.device}</p>
                <p className="text-xs text-gray-600">{login.location} • {login.ip}</p>
              </div>
              <p className="text-xs text-gray-500">{new Date(login.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'profile': return renderProfile();
      case 'farmer': return renderFarmer();
      case 'buyer': return renderBuyer();
      case 'warehouse': return renderWarehouse();
      case 'settings': return renderSettings();
      case 'security': return renderSecurity();
      case 'activity': return renderActivity();
      default: return renderOverview();
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <HomeButton />
      <PageHeader
        title="Profile Dashboard"
        subtitle="Manage your account, preferences, and profile information"
        icon="👤"
      />

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 bg-white/90 backdrop-blur-xl p-2 rounded-2xl border-2 border-green-100 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <Section>
        {renderTabContent()}
      </Section>

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  );
}

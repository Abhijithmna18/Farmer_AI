// src/components/WarehouseRegistrationForm.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPinIcon, 
  BuildingOfficeIcon, 
  CurrencyRupeeIcon,
  PhotoIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { gsap } from 'gsap';
import apiClient from '../services/apiClient';

const WarehouseRegistrationForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      coordinates: { latitude: '', longitude: '' }
    },
    capacity: {
      total: '',
      unit: 'tons'
    },
    storageTypes: [],
    pricePerDay: '',
    pricePerTon: '',
    facilities: [],
    operatingHours: {
      start: '06:00',
      end: '22:00',
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    images: [],
    documents: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [documentFiles, setDocumentFiles] = useState([]);
  const formRef = useRef(null);

  const storageTypeOptions = [
    { value: 'cold-storage', label: 'Cold Storage' },
    { value: 'dry-storage', label: 'Dry Storage' },
    { value: 'refrigerated', label: 'Refrigerated' },
    { value: 'frozen', label: 'Frozen Storage' },
    { value: 'temperature-control', label: 'Temperature Control' },
    { value: 'pest-control', label: 'Pest Control' },
    { value: 'general', label: 'General Storage' }
  ];

  const facilityOptions = [
    { value: '24x7-security', label: '24/7 Security' },
    { value: 'cctv-monitoring', label: 'CCTV Monitoring' },
    { value: 'fire-safety', label: 'Fire Safety' },
    { value: 'loading-dock', label: 'Loading Dock' },
    { value: 'forklift', label: 'Forklift Available' },
    { value: 'temperature-monitoring', label: 'Temperature Monitoring' },
    { value: 'humidity-control', label: 'Humidity Control' },
    { value: 'pest-control', label: 'Pest Control' },
    { value: 'insurance-coverage', label: 'Insurance Coverage' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'packaging', label: 'Packaging Services' },
    { value: 'quality-check', label: 'Quality Check' }
  ];

  const documentTypes = [
    { value: 'license', label: 'Business License' },
    { value: 'permit', label: 'Storage Permit' },
    { value: 'insurance', label: 'Insurance Certificate' },
    { value: 'certificate', label: 'Quality Certificate' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (isOpen && formRef.current) {
      gsap.fromTo(formRef.current, 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleArrayChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    setDocumentFiles(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index) => {
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            address: {
              ...prev.address,
              coordinates: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              }
            }
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Could not get your location. Please enter coordinates manually.');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.address.street) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.storageTypes.length === 0) {
        throw new Error('Please select at least one storage type');
      }

      if (!formData.pricePerDay && !formData.pricePerTon) {
        throw new Error('Please set either daily or per-ton pricing');
      }

      // Prepare form data for API
      const warehouseData = {
        ...formData,
        capacity: {
          total: parseFloat(formData.capacity.total),
          unit: formData.capacity.unit
        },
        pricePerDay: formData.pricePerDay ? parseFloat(formData.pricePerDay) : undefined,
        pricePerTon: formData.pricePerTon ? parseFloat(formData.pricePerTon) : undefined,
        address: {
          ...formData.address,
          coordinates: {
            latitude: parseFloat(formData.address.coordinates.latitude),
            longitude: parseFloat(formData.address.coordinates.longitude)
          }
        }
      };

      // Upload images and documents if any
      if (imageFiles.length > 0 || documentFiles.length > 0) {
        const uploadData = new FormData();
        
        // Add warehouse data
        uploadData.append('warehouseData', JSON.stringify(warehouseData));
        
        // Add images
        imageFiles.forEach((file, index) => {
          uploadData.append(`images`, file);
        });
        
        // Add documents
        documentFiles.forEach((file, index) => {
          uploadData.append(`documents`, file);
        });

        const response = await apiClient.post('/warehouses', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          onSuccess?.(response.data.data);
          onClose();
        } else {
          throw new Error(response.data.message || 'Failed to create warehouse');
        }
      } else {
        const response = await apiClient.post('/warehouses', warehouseData);
        
        if (response.data.success) {
          onSuccess?.(response.data.data);
          onClose();
        } else {
          throw new Error(response.data.message || 'Failed to create warehouse');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to create warehouse');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        ref={formRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Register New Warehouse</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <BuildingOfficeIcon className="h-5 w-5" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter warehouse name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Capacity *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.capacity.total}
                    onChange={(e) => handleInputChange('capacity.total', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter capacity"
                    required
                  />
                  <select
                    value={formData.capacity.unit}
                    onChange={(e) => handleInputChange('capacity.unit', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="tons">Tons</option>
                    <option value="kg">Kilograms</option>
                    <option value="quintals">Quintals</option>
                    <option value="bags">Bags</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Describe your warehouse facilities and services"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <MapPinIcon className="h-5 w-5" />
              Location
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter street address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter city"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter state"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  value={formData.address.pincode}
                  onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter pincode"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coordinates (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    value={formData.address.coordinates.latitude}
                    onChange={(e) => handleInputChange('address.coordinates.latitude', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Latitude"
                  />
                  <input
                    type="number"
                    step="any"
                    value={formData.address.coordinates.longitude}
                    onChange={(e) => handleInputChange('address.coordinates.longitude', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Longitude"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    📍
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Storage Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Storage Types *</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {storageTypeOptions.map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.storageTypes.includes(option.value)}
                    onChange={(e) => handleArrayChange('storageTypes', option.value, e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <CurrencyRupeeIcon className="h-5 w-5" />
              Pricing
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Day (₹)
                </label>
                <input
                  type="number"
                  value={formData.pricePerDay}
                  onChange={(e) => handleInputChange('pricePerDay', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter daily rate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Ton (₹)
                </label>
                <input
                  type="number"
                  value={formData.pricePerTon}
                  onChange={(e) => handleInputChange('pricePerTon', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter per-ton rate"
                />
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Facilities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {facilityOptions.map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.facilities.includes(option.value)}
                    onChange={(e) => handleArrayChange('facilities', option.value, e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Operating Hours</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Time
                </label>
                <input
                  type="time"
                  value={formData.operatingHours.start}
                  onChange={(e) => handleInputChange('operatingHours.start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Closing Time
                </label>
                <input
                  type="time"
                  value={formData.operatingHours.end}
                  onChange={(e) => handleInputChange('operatingHours.end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <PhotoIcon className="h-5 w-5" />
              Images
            </h3>
            
            <div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Upload Images
              </label>
            </div>

            {imageFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Documents</h3>
            
            <div>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleDocumentUpload}
                className="hidden"
                id="document-upload"
              />
              <label
                htmlFor="document-upload"
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Upload Documents
              </label>
            </div>

            {documentFiles.length > 0 && (
              <div className="space-y-2">
                {documentFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Warehouse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarehouseRegistrationForm;











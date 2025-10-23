// src/components/BookingModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadRazorpayScript, createRazorpayOrder, verifyPayment } from '../config/razorpay';
import { XMarkIcon, CalendarIcon, CurrencyRupeeIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { gsap } from 'gsap';
import apiClient from '../services/apiClient';
import { auth } from '../firebase';

const BookingModal = ({ isOpen, onClose, warehouse, onBook }) => {
  const [formData, setFormData] = useState({
    produce: {
      type: '',
      quantity: '',
      unit: 'kg',
      quality: 'good',
      description: '',
      expectedHarvestDate: ''
    },
    storageRequirements: {
      temperature: { min: '', max: '' },
      humidity: { min: '', max: '' },
      storageType: '',
      specialHandling: ''
    },
    bookingDates: {
      startDate: '',
      endDate: ''
    }
  });
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);
  const backdropRef = useRef(null);
  const navigate = useNavigate();

  const produceTypes = [
    'Wheat', 'Rice', 'Corn', 'Soybean', 'Cotton', 'Sugarcane', 'Potato', 'Tomato',
    'Onion', 'Garlic', 'Ginger', 'Turmeric', 'Chili', 'Pepper', 'Cardamom',
    'Cumin', 'Coriander', 'Fenugreek', 'Mustard', 'Sunflower', 'Groundnut',
    'Sesame', 'Pulses', 'Lentils', 'Chickpeas', 'Green Gram', 'Black Gram',
    'Pigeon Pea', 'Other'
  ];

  const units = ['kg', 'tons', 'quintals', 'bags'];
  const qualities = [
    { value: 'premium', label: 'Premium' },
    { value: 'good', label: 'Good' },
    { value: 'average', label: 'Average' },
    { value: 'fair', label: 'Fair' }
  ];

  const storageTypes = [
    'cold-storage', 'pest-control', 'temperature-control', 'general', 'refrigerated', 'frozen'
  ];

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        produce: {
          type: '',
          quantity: '',
          unit: 'kg',
          quality: 'good',
          description: '',
          expectedHarvestDate: ''
        },
        storageRequirements: {
          temperature: { min: '', max: '' },
          humidity: { min: '', max: '' },
          storageType: warehouse?.storageTypes?.[0] || '',
          specialHandling: ''
        },
        bookingDates: {
          startDate: '',
          endDate: ''
        }
      });
      setErrors({});
      setCalculatedPrice(0);

      // Animate modal in
      gsap.fromTo(backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );
      gsap.fromTo(modalRef.current,
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [isOpen, warehouse]);

  const handleClose = () => {
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.2 });
    gsap.to(modalRef.current, 
      { y: 50, opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in' },
      () => onClose()
    );
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    // Clear error when user starts typing
    if (errors[`${section}.${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`${section}.${field}`]: null
      }));
    }
  };

  const handleNestedInputChange = (section, field, subField, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: {
          ...prev[section][field],
          [subField]: value
        }
      }
    }));
  };

  const calculatePrice = async () => {
    if (!formData.bookingDates.startDate || !formData.bookingDates.endDate || !formData.produce.quantity) {
      return;
    }

    setIsCalculating(true);
    try {
      const { data } = await apiClient.get(`/warehouse-bookings/warehouse/${warehouse._id}/availability`, {
        params: {
          startDate: formData.bookingDates.startDate,
          endDate: formData.bookingDates.endDate,
          quantity: formData.produce.quantity,
        }
      });
      if (data?.success && data?.data?.price?.totalPrice) {
        setCalculatedPrice(data.data.price.totalPrice);
      } else if (data?.success && typeof data?.data?.price === 'number') {
        setCalculatedPrice(data.data.price);
      }
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    calculatePrice();
  }, [formData.bookingDates.startDate, formData.bookingDates.endDate, formData.produce.quantity]);

  const validateForm = () => {
    const newErrors = {};

    // Validate produce
    if (!formData.produce.type) newErrors['produce.type'] = 'Produce type is required';
    if (!formData.produce.quantity || formData.produce.quantity <= 0) {
      newErrors['produce.quantity'] = 'Valid quantity is required';
    }

    // Validate storage requirements
    if (!formData.storageRequirements.storageType) {
      newErrors['storageRequirements.storageType'] = 'Storage type is required';
    }

    // Validate booking dates
    if (!formData.bookingDates.startDate) {
      newErrors['bookingDates.startDate'] = 'Start date is required';
    }
    if (!formData.bookingDates.endDate) {
      newErrors['bookingDates.endDate'] = 'End date is required';
    }
    if (formData.bookingDates.startDate && formData.bookingDates.endDate) {
      const startDate = new Date(formData.bookingDates.startDate);
      const endDate = new Date(formData.bookingDates.endDate);
      if (endDate <= startDate) {
        newErrors['bookingDates.endDate'] = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const { data } = await apiClient.post('/warehouse-bookings/book', {
          warehouseId: warehouse._id,
          produce: formData.produce,
          storageRequirements: formData.storageRequirements,
          bookingDates: formData.bookingDates,
          notes: formData.produce.description
        });

        if (data?.success) {
          onBook(data.data);
          const booking = data?.data?.booking || data?.data;
          const bookingId = booking?._id;
          const paymentUrl = data?.data?.paymentUrl;
          if (paymentUrl) {
            // External checkout URL (e.g., hosted page)
            window.location.href = paymentUrl;
          } else if (bookingId) {
            // Open Razorpay checkout directly
            try {
              // Refresh Firebase token before payment
              console.log('🔄 Refreshing Firebase token before payment...');
              const currentUser = auth.currentUser;
              if (currentUser) {
                try {
                  const freshToken = await currentUser.getIdToken(true);
                  localStorage.setItem('token', freshToken);
                  console.log('✅ Token refreshed successfully');
                } catch (tokenError) {
                  console.error('❌ Failed to refresh token:', tokenError);
                  throw new Error('Authentication failed. Please login again.');
                }
              }
              
              const scriptLoaded = await loadRazorpayScript();
              if (!scriptLoaded) throw new Error('Failed to load Razorpay script');

              const amount = booking?.pricing?.totalAmount || Number(calculatedPrice) || 0;
              if (!amount) throw new Error('Unable to determine payment amount');

              const orderData = await createRazorpayOrder(amount, 'INR', bookingId);
              if (!orderData?.id) {
                console.error('Razorpay order missing id:', orderData);
                throw new Error('Invalid Razorpay order response');
              }

              const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: amount * 100,
                currency: 'INR',
                name: 'FarmerAI',
                description: booking?.warehouse?.name ? `Booking for ${booking.warehouse.name}` : 'Warehouse Booking',
                order_id: orderData.id,
                handler: async function (response) {
                  try {
                    await verifyPayment(
                      bookingId, 
                      response.razorpay_payment_id, 
                      response.razorpay_signature,
                      response.razorpay_order_id
                    );
                    navigate('/my-bookings');
                  } catch (err) {
                    console.error('Payment verification failed:', err);
                    // stay on modal; user can retry
                  }
                },
                theme: { color: '#10B981' },
                modal: {
                  ondismiss: () => {
                    // User closed the payment modal; keep them on the booking modal
                  }
                }
              };

              const rzp = new window.Razorpay(options);
              rzp.open();
            } catch (err) {
              console.error('Razorpay init error:', err);
              // As a fallback, navigate to internal payment page
              navigate(`/payment/${bookingId}`);
            }
          } else {
            console.error('No bookingId or paymentUrl returned from booking API:', data);
          }
        } else {
          console.error('Booking failed:', data?.message);
        }
      } catch (error) {
        console.error('Error creating booking:', error);
        // Handle error - show toast or error message
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Book Warehouse</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Warehouse Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{warehouse.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{warehouse.description}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Location:</span>
              <span>{warehouse.location.city}, {warehouse.location.state}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Price:</span>
              <span className="font-medium text-green-600">₹{warehouse.pricing.basePrice}/day</span>
            </div>
          </div>

          {/* Produce Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Produce Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produce Type *
                </label>
                <select
                  value={formData.produce.type}
                  onChange={(e) => handleInputChange('produce', 'type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select produce type</option>
                  {produceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors['produce.type'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['produce.type']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.produce.quantity}
                    onChange={(e) => handleInputChange('produce', 'quantity', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter quantity"
                  />
                  <select
                    value={formData.produce.unit}
                    onChange={(e) => handleInputChange('produce', 'unit', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                {errors['produce.quantity'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['produce.quantity']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality
                </label>
                <select
                  value={formData.produce.quality}
                  onChange={(e) => handleInputChange('produce', 'quality', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {qualities.map(quality => (
                    <option key={quality.value} value={quality.value}>{quality.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Harvest Date
                </label>
                <input
                  type="date"
                  value={formData.produce.expectedHarvestDate}
                  onChange={(e) => handleInputChange('produce', 'expectedHarvestDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.produce.description}
                onChange={(e) => handleInputChange('produce', 'description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Additional details about your produce..."
              />
            </div>
          </div>

          {/* Storage Requirements */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Storage Type *
                </label>
                <select
                  value={formData.storageRequirements.storageType}
                  onChange={(e) => handleInputChange('storageRequirements', 'storageType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select storage type</option>
                  {storageTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
                {errors['storageRequirements.storageType'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['storageRequirements.storageType']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature Range (°C)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={formData.storageRequirements.temperature.min}
                    onChange={(e) => handleNestedInputChange('storageRequirements', 'temperature', 'min', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={formData.storageRequirements.temperature.max}
                    onChange={(e) => handleNestedInputChange('storageRequirements', 'temperature', 'max', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Humidity Range (%)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={formData.storageRequirements.humidity.min}
                    onChange={(e) => handleNestedInputChange('storageRequirements', 'humidity', 'min', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={formData.storageRequirements.humidity.max}
                    onChange={(e) => handleNestedInputChange('storageRequirements', 'humidity', 'max', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Handling
                </label>
                <input
                  type="text"
                  value={formData.storageRequirements.specialHandling}
                  onChange={(e) => handleInputChange('storageRequirements', 'specialHandling', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Any special requirements..."
                />
              </div>
            </div>
          </div>

          {/* Booking Dates */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.bookingDates.startDate}
                  onChange={(e) => handleInputChange('bookingDates', 'startDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {errors['bookingDates.startDate'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['bookingDates.startDate']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.bookingDates.endDate}
                  onChange={(e) => handleInputChange('bookingDates', 'endDate', e.target.value)}
                  min={formData.bookingDates.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {errors['bookingDates.endDate'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['bookingDates.endDate']}</p>
                )}
              </div>
            </div>
          </div>

          {/* Price Calculation */}
          {calculatedPrice > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-green-900">Estimated Total Cost</h4>
                  <p className="text-sm text-green-700">
                    {formData.bookingDates.startDate && formData.bookingDates.endDate && (
                      <>
                        {Math.ceil((new Date(formData.bookingDates.endDate) - new Date(formData.bookingDates.startDate)) / (1000 * 60 * 60 * 24))} days × ₹{warehouse.pricing.basePrice}/day
                      </>
                    )}
                  </p>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ₹{calculatedPrice}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!calculatedPrice || isCalculating}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isCalculating ? 'Calculating...' : 'Proceed to Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
























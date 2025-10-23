import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import { gsap } from 'gsap';
import apiClient from '../services/apiClient';

const BookingForm = ({ isOpen, onClose, warehouse, onBook }) => {
  const [formData, setFormData] = useState({
    produceType: '',
    quantity: '',
    startDate: '',
    endDate: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        produceType: '',
        quantity: '',
        startDate: '',
        endDate: '',
        notes: ''
      });
      setErrors({});
      
      gsap.fromTo('.booking-modal',
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [isOpen]); // This is correct - only runs when isOpen changes

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

  const minDays = Math.max(1, Number(warehouse?.pricing?.minimumDays || 1));
  const availableCapacity = Number(warehouse?.capacity?.available || 0); // in same unit as UI (tons)
  const basePrice = Number(warehouse?.pricing?.basePrice || 0);

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (startDate && endDate && endDate > startDate) {
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      return days * basePrice * quantity;
    }
    return 0;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.produceType.trim()) {
      newErrors.produceType = 'Please specify the type of produce';
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Please enter a valid quantity';
    }
    if (availableCapacity > 0 && parseFloat(formData.quantity) > availableCapacity) {
      newErrors.quantity = `Quantity exceeds available capacity (${availableCapacity} ${warehouse?.capacity?.unit || 'tons'})`;
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Please select a start date';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Please select an end date';
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }

      if (endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date';
      }

      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      if (!newErrors.endDate && days < minDays) {
        newErrors.endDate = `Minimum booking is ${minDays} day${minDays>1?'s':''}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const totalAmount = calculateTotal();

      const bookingData = {
        warehouseId: warehouse._id,
        produceType: formData.produceType,
        quantity: parseFloat(formData.quantity),
        startDate: formData.startDate,
        endDate: formData.endDate,
        duration,
        totalAmount,
        notes: formData.notes
      };

      // Create booking via backend API base
      const { data } = await apiClient.post('/warehouse-bookings/book', {
        warehouseId: bookingData.warehouseId,
        produce: {
          type: bookingData.produceType,
          quantity: bookingData.quantity,
          unit: 'kg',
          quality: 'good',
          description: bookingData.notes
        },
        storageRequirements: {
          storageType: 'general'
        },
        bookingDates: {
          startDate: bookingData.startDate,
          endDate: bookingData.endDate
        },
        notes: bookingData.notes
      });

      if (data?.success) {
        // Redirect to payment page or show payment modal
        const bookingId = data?.data?.booking?._id || data?.data?._id;
        if (bookingId) {
          window.location.href = `/payment/${bookingId}`;
        } else {
          throw new Error('Booking created, but response missing booking ID');
        }
      } else {
        throw new Error(data?.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    gsap.to('.booking-modal', {
      scale: 0.9,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: onClose
    });
  };

  if (!isOpen) return null;

  const totalAmount = calculateTotal();
  const duration = formData.startDate && formData.endDate 
    ? Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-800/60 to-slate-900/70 backdrop-blur-sm" onClick={handleClose} />

      <div className="booking-modal relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/30 bg-white/20 backdrop-blur-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/30 bg-white/10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 drop-shadow-sm">Book Warehouse</h2>
            <p className="text-gray-700 mt-1">{warehouse?.name}</p>
            <div className="text-xs text-gray-600 mt-1">Minimum {minDays} day{minDays>1?'s':''} • Available: {availableCapacity} {warehouse?.capacity?.unit || 'tons'} • ₹{basePrice}/day</div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg transition-colors border border-white/40 bg-white/40 hover:bg-white/60"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Produce Type */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Type of Produce *
            </label>
            <select
              name="produceType"
              value={formData.produceType}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.produceType ? 'border-red-300' : 'border-white/60'
              }`}
            >
              <option value="">Select produce type</option>
              <option value="grains">Grains (Rice, Wheat, etc.)</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="spices">Spices</option>
              <option value="pulses">Pulses</option>
              <option value="oilseeds">Oilseeds</option>
              <option value="other">Other</option>
            </select>
            {errors.produceType && (
              <p className="mt-1 text-sm text-red-600">{errors.produceType}</p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Quantity (in tons) *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="0.1"
              step="0.1"
              placeholder="Enter quantity in tons"
              className={`w-full px-3 py-2 border rounded-lg bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.quantity ? 'border-red-300' : 'border-white/60'
              }`}
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.startDate ? 'border-red-300' : 'border-white/60'
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.endDate ? 'border-red-300' : 'border-white/60'
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Any special requirements or notes..."
              className="w-full px-3 py-2 border border-white/60 bg-white/50 backdrop-blur-sm rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Pricing Summary */}
          {totalAmount > 0 && (
            <div className="rounded-lg p-4 border border-white/40 bg-white/40 backdrop-blur-sm">
              <h3 className="font-medium text-gray-900 mb-3">Booking Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per day:</span>
                  <span>₹{basePrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span>{formData.quantity} tons</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span>{duration} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Minimum days:</span>
                  <span>{minDays}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Amount:</span>
                    <span className="text-green-600">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/30">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-800 border border-white/50 rounded-lg hover:bg-white/50 backdrop-blur-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalAmount <= 0}
              className="px-6 py-2 bg-green-600/90 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shadow"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CurrencyRupeeIcon className="h-4 w-4 mr-2" />
                  Proceed to Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;

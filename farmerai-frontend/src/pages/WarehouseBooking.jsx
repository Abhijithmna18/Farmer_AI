import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { toast } from 'react-hot-toast';
import {
  MapPinIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  CurrencyRupeeIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  TruckIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function WarehouseBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState({
    produce: {
      type: '',
      quantity: '',
      unit: 'tons',
      quality: 'good',
      expectedHarvestDate: '',
      description: ''
    },
    storageRequirements: {
      storageType: '',
      temperatureMin: '',
      temperatureMax: '',
      humidityMin: '',
      humidityMax: '',
      specialHandling: ''
    },
    bookingDates: {
      startDate: '',
      endDate: ''
    }
  });
  const [bookingError, setBookingError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // --- Input helpers ---
  const noLeadingSpace = (value) => value.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
  const onKeyDownNoSpace = (e) => {
    if (e.key === ' ') e.preventDefault();
  };
  const onKeyDownNoEnter = (e) => {
    if (e.key === 'Enter') e.preventDefault();
  };
  const onKeyDownNumeric = (e) => {
    // Block spaces and invalid chars like e, E, +, - for numeric inputs
    if ([' ', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
  };
  const sanitizeNumber = (v) => String(v).replace(/[^0-9.]/g, '');

  useEffect(() => {
    loadWarehouse();
  }, [id]);

  const loadWarehouse = async () => {
    try {
      const response = await apiClient.get(`/warehouses/${id}`);
      if (response.data?.success) {
        setWarehouse(response.data.data);
      } else {
        setError('Warehouse not found');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load warehouse');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setBooking(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: typeof value === 'string' ? noLeadingSpace(value) : value
        }
      }));
    } else {
      setBooking(prev => ({
        ...prev,
        [field]: typeof value === 'string' ? noLeadingSpace(value) : value
      }));
    }
  };

  // Calculate duration in days
  const duration = useMemo(() => {
    if (!booking.bookingDates.startDate || !booking.bookingDates.endDate) return 0;
    const start = new Date(booking.bookingDates.startDate);
    const end = new Date(booking.bookingDates.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }, [booking.bookingDates.startDate, booking.bookingDates.endDate]);

  // Calculate pricing breakdown
  const pricingBreakdown = useMemo(() => {
    const quantity = parseFloat(booking.produce.quantity) || 0;
    const basePrice = warehouse?.pricing?.basePrice || 0;
    
    if (!duration || !quantity || !basePrice) {
      return { baseAmount: 0, platformFee: 0, total: 0 };
    }

    const baseAmount = basePrice * duration * quantity;
    const platformFee = Math.round(baseAmount * 0.05);
    const total = baseAmount + platformFee;

    return { baseAmount, platformFee, total };
  }, [warehouse, duration, booking.produce.quantity]);

  // Check capacity availability
  const isCapacityAvailable = useMemo(() => {
    if (!warehouse || !booking.produce.quantity) return true;
    const requestedQty = parseFloat(booking.produce.quantity) || 0;
    const availableQty = warehouse.capacity?.available || 0;
    return requestedQty <= availableQty;
  }, [warehouse, booking.produce.quantity]);

  const validateForm = () => {
    const errors = {};
    
    if (!booking.produce.type) errors.produceType = 'Please select a produce type';
    if (!booking.produce.quantity || Number(booking.produce.quantity) <= 0) {
      errors.produceQuantity = 'Please enter a valid quantity';
    }
    if (!isCapacityAvailable) {
      errors.produceQuantity = `Quantity exceeds available capacity (${warehouse?.capacity?.available} ${warehouse?.capacity?.unit})`;
    }
    if (!booking.bookingDates.startDate) errors.startDate = 'Please select a start date';
    if (!booking.bookingDates.endDate) errors.endDate = 'Please select an end date';
    if (duration <= 0) errors.endDate = 'End date must be after start date';
    if (duration < (warehouse?.terms?.minimumBookingDuration || 1)) {
      errors.endDate = `Minimum booking duration is ${warehouse?.terms?.minimumBookingDuration || 1} days`;
    }
    
    // Validate harvest date logic
    if (booking.produce.expectedHarvestDate) {
      const harvestDate = new Date(booking.produce.expectedHarvestDate);
      const startDate = booking.bookingDates.startDate ? new Date(booking.bookingDates.startDate) : null;
      
      if (startDate && harvestDate > startDate) {
        errors.harvestDate = 'Harvest date must be before or on storage start date';
      }
    }
    
    if (!termsAccepted) errors.terms = 'Please accept terms and conditions';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBookingError(null);
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setShowConfirmation(true);
  };

  const confirmBooking = async () => {
    setSubmitting(true);

    try {

      const payload = {
        warehouseId: id,
        produce: {
          type: booking.produce.type,
          quantity: parseFloat(booking.produce.quantity),
          unit: booking.produce.unit,
          quality: booking.produce.quality,
          expectedHarvestDate: booking.produce.expectedHarvestDate || null,
          description: booking.produce.description || ''
        },
        storageRequirements: {
          storageType: booking.storageRequirements.storageType || 'general',
          temperature: {
            min: parseFloat(booking.storageRequirements.temperatureMin) || null,
            max: parseFloat(booking.storageRequirements.temperatureMax) || null
          },
          humidity: {
            min: parseFloat(booking.storageRequirements.humidityMin) || null,
            max: parseFloat(booking.storageRequirements.humidityMax) || null
          },
          specialHandling: booking.storageRequirements.specialHandling || ''
        },
        bookingDates: {
          startDate: booking.bookingDates.startDate,
          endDate: booking.bookingDates.endDate
        }
      };

      // Create booking via backend unified warehouse-bookings route
      const response = await apiClient.post(`/warehouse-bookings/book`, payload);
      
      if (response.data?.success) {
        toast.success('Booking created successfully!');
        setShowConfirmation(false);
        
        // Redirect to payment page
        const bookingId = response.data?.data?.booking?._id || response.data?.data?._id;
        setTimeout(() => {
          navigate(`/payment/${bookingId}`);
        }, 500);
      } else {
        setBookingError(response.data?.message || 'Booking failed');
        toast.error(response.data?.message || 'Booking failed');
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || 'Booking failed';
      setBookingError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
      setShowConfirmation(false);
    }
  };

  // Image carousel handlers
  const nextImage = () => {
    if (warehouse?.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % warehouse.images.length);
    }
  };

  const prevImage = () => {
    if (warehouse?.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + warehouse.images.length) % warehouse.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading warehouse...</p>
        </div>
      </div>
    );
  }

  if (error || !warehouse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/warehouses')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to Warehouses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/warehouses')}
            className="inline-flex items-center text-emerald-700 hover:text-emerald-800 font-medium mb-4 transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Back to Warehouses
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Book Warehouse</h1>
          <p className="text-gray-600">Complete the form below to reserve storage space</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Warehouse Details - Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Main Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{warehouse.name}</h2>
                  <div className="flex items-start text-gray-600 text-sm">
                    <MapPinIcon className="h-5 w-5 mr-1 flex-shrink-0 mt-0.5" />
                    <span>{warehouse.location?.address}, {warehouse.location?.city}, {warehouse.location?.state}</span>
                  </div>
                </div>
              </div>

              {/* Image Carousel */}
              {warehouse.images && warehouse.images.length > 0 && (
                <div className="relative mb-4 group">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={warehouse.images[currentImageIndex]?.url || '/placeholder.jpg'}
                      alt={`${warehouse.name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {warehouse.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {warehouse.images.map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all ${
                              idx === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Description */}
              <p className="text-gray-700 text-sm mb-4 line-clamp-3">{warehouse.description}</p>

              {/* Key Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-emerald-50 rounded-lg p-3">
                  <div className="flex items-center text-emerald-700 mb-1">
                    <CubeIcon className="h-4 w-4 mr-1" />
                    <span className="text-xs font-medium">Capacity</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {warehouse.capacity?.available} / {warehouse.capacity?.total}
                  </div>
                  <div className="text-xs text-gray-600">{warehouse.capacity?.unit} available</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center text-blue-700 mb-1">
                    <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
                    <span className="text-xs font-medium">Price</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">₹{warehouse.pricing?.basePrice}</div>
                  <div className="text-xs text-gray-600">per ton/day</div>
                </div>
              </div>

              {/* Storage Types */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Storage Types</div>
                <div className="flex flex-wrap gap-1.5">
                  {warehouse.storageTypes?.map(type => (
                    <span key={type} className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      {type.replace('_', ' ').replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Facilities */}
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Facilities</div>
                <div className="flex flex-wrap gap-1.5">
                  {warehouse.facilities?.map(facility => (
                    <span key={facility} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                      {facility.replace('_', ' ').replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Owner Info Card */}
            {warehouse.owner && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Warehouse Owner
                </h3>
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-gray-900">
                    {warehouse.owner.firstName} {warehouse.owner.lastName}
                  </div>
                  {warehouse.owner.phone && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      {warehouse.owner.phone}
                    </div>
                  )}
                  {warehouse.owner.email && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      {warehouse.owner.email}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Booking Form - Right 2 Columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
            <h2 className="text-xl font-semibold mb-1">Booking Details</h2>
            <p className="text-sm text-gray-600 mb-4">Fill the form to reserve storage for your produce in this facility.</p>
            
            {bookingError && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/80 text-red-800 rounded-lg p-4 mb-4">
                {bookingError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" onKeyDown={onKeyDownNoEnter}>
              {/* Produce Information */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Produce Information</div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Produce Type</label>
                <select
                  id="produce-type"
                  required
                  value={booking.produce.type}
                  onChange={(e) => handleInputChange('produce.type', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select produce type</option>
                  {['Wheat','Rice','Corn','Soybean','Cotton','Sugarcane','Potato','Tomato','Onion','Garlic','Ginger','Turmeric','Chili Pepper','Cardamom','Cumin','Coriander','Fenugreek','Mustard','Sunflower','Groundnut','Sesame','Pulses','Lentils','Chickpeas','Green Gram','Black Gram','Pigeon Pea','Other'].map(o => (
                    <option key={o} value={o.toLowerCase().replace(/\s+/g,'-')}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Quantity</label>
                  <input
                    id="produce-quantity"
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="100"
                    value={booking.produce.quantity}
                    onChange={(e) => handleInputChange('produce.quantity', sanitizeNumber(e.target.value))}
                    onKeyDown={onKeyDownNumeric}
                    inputMode="decimal"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Unit</label>
                  <select
                    value={booking.produce.unit}
                    onChange={(e) => handleInputChange('produce.unit', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="kg">kg</option>
                    <option value="tons">tons</option>
                    <option value="quintals">quintals</option>
                    <option value="bags">bags</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Quality</label>
                  <select
                    value={booking.produce.quality}
                    onChange={(e)=>handleInputChange('produce.quality', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="premium">Premium</option>
                    <option value="good">Good</option>
                    <option value="average">Average</option>
                    <option value="fair">Fair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Expected Harvest Date (Optional)
                  </label>
                  <input 
                    id="harvest-date"
                    type="date" 
                    value={booking.produce.expectedHarvestDate} 
                    onChange={(e)=>handleInputChange('produce.expectedHarvestDate', e.target.value)}
                    max={booking.bookingDates.startDate || undefined}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                      fieldErrors.harvestDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be before or on storage start date</p>
                  {fieldErrors.harvestDate && (
                    <div className="text-sm text-red-600 mt-1 flex items-start gap-1">
                      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{fieldErrors.harvestDate}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Description (Optional)</label>
                <textarea
                  rows="2"
                  value={booking.produce.description} 
                  onChange={(e)=>handleInputChange('produce.description', e.target.value)} 
                  onBlur={(e)=>handleInputChange('produce.description', e.target.value.trim())} 
                  placeholder="Any additional details about the produce"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>
              
              {/* Capacity Check */}
              {booking.produce.quantity && !isCapacityAvailable && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <span className="font-medium">Insufficient capacity!</span> Available: {warehouse?.capacity?.available} {warehouse?.capacity?.unit}
                  </div>
                </div>
              )}
              {fieldErrors.produceQuantity && (
                <div className="text-sm text-red-600 mt-1">{fieldErrors.produceQuantity}</div>
              )}

              {/* Storage Requirements */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Storage Type</label>
                    <select value={booking.storageRequirements.storageType} onChange={(e)=>handleInputChange('storageRequirements.storageType', e.target.value)} className="w-full border border-white/60 bg-white/50 backdrop-blur-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                      <option value="">Select storage type</option>
                      {['Cold Storage','Pest Control','Temperature Control','General','Refrigerated','Frozen'].map(t => (<option key={t} value={t.toLowerCase().replace(/\s+/g,'-')}>{t}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Special Handling</label>
                    <input type="text" value={booking.storageRequirements.specialHandling} onChange={(e)=>handleInputChange('storageRequirements.specialHandling', e.target.value)} onKeyDown={onKeyDownNoEnter} onBlur={(e)=>handleInputChange('storageRequirements.specialHandling', e.target.value.trim())} placeholder="Optional" className="w-full border border-white/60 bg-white/50 backdrop-blur-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Temperature Min (°C)</label>
                      <input type="number" step="0.1" value={booking.storageRequirements.temperatureMin} onChange={(e)=>handleInputChange('storageRequirements.temperatureMin', sanitizeNumber(e.target.value))} onKeyDown={onKeyDownNumeric} inputMode="decimal" className="w-full border border-white/60 bg-white/50 backdrop-blur-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Temperature Max (°C)</label>
                      <input type="number" step="0.1" value={booking.storageRequirements.temperatureMax} onChange={(e)=>handleInputChange('storageRequirements.temperatureMax', sanitizeNumber(e.target.value))} onKeyDown={onKeyDownNumeric} inputMode="decimal" className="w-full border border-white/60 bg-white/50 backdrop-blur-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Humidity Min (%)</label>
                      <input type="number" step="1" value={booking.storageRequirements.humidityMin} onChange={(e)=>handleInputChange('storageRequirements.humidityMin', sanitizeNumber(e.target.value))} onKeyDown={onKeyDownNumeric} inputMode="numeric" className="w-full border border-white/60 bg-white/50 backdrop-blur-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Humidity Max (%)</label>
                      <input type="number" step="1" value={booking.storageRequirements.humidityMax} onChange={(e)=>handleInputChange('storageRequirements.humidityMax', sanitizeNumber(e.target.value))} onKeyDown={onKeyDownNumeric} inputMode="numeric" className="w-full border border-white/60 bg-white/50 backdrop-blur-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Dates */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <CalendarDaysIcon className="h-5 w-5 text-emerald-600" />
                  <span>Storage Period</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Start Date</label>
                    <input
                      id="start-date"
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={booking.bookingDates.startDate}
                      onChange={(e) => handleInputChange('bookingDates.startDate', e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        fieldErrors.startDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {fieldErrors.startDate && (
                      <div className="text-sm text-red-600 mt-1">{fieldErrors.startDate}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">End Date</label>
                    <input
                      id="end-date"
                      type="date"
                      required
                      min={booking.bookingDates.startDate || new Date().toISOString().split('T')[0]}
                      value={booking.bookingDates.endDate}
                      onChange={(e) => handleInputChange('bookingDates.endDate', e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        fieldErrors.endDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {fieldErrors.endDate && (
                      <div className="text-sm text-red-600 mt-1">{fieldErrors.endDate}</div>
                    )}
                  </div>
                </div>
                {booking.produce.expectedHarvestDate && booking.bookingDates.startDate && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <span className="font-medium">Note:</span> Your harvest date ({new Date(booking.produce.expectedHarvestDate).toLocaleDateString()}) is {new Date(booking.produce.expectedHarvestDate) <= new Date(booking.bookingDates.startDate) ? 'correctly' : 'incorrectly'} set {new Date(booking.produce.expectedHarvestDate) <= new Date(booking.bookingDates.startDate) ? 'before' : 'after'} the storage start date.
                    </div>
                  </div>
                )}
              </div>

              {/* Duration Info */}
              {duration > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">Booking Duration:</span> {duration} day{duration !== 1 ? 's' : ''}
                  </div>
                </div>
              )}

              {/* Price Summary */}
              {pricingBreakdown.total > 0 && (
                <div className="rounded-xl p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <CurrencyRupeeIcon className="h-5 w-5 mr-1" />
                    Price Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Base Amount ({booking.produce.quantity} {booking.produce.unit} × {duration} days):</span>
                      <span className="font-medium">₹{pricingBreakdown.baseAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Platform Fee (5%):</span>
                      <span className="font-medium">₹{pricingBreakdown.platformFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg text-gray-900 border-t border-emerald-300 pt-2 mt-2">
                      <span>Total Amount:</span>
                      <span className="text-emerald-700">₹{pricingBreakdown.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Terms & Conditions */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer select-none">
                  I agree to the <span className="text-emerald-600 font-medium">terms and conditions</span> and understand the <span className="text-emerald-600 font-medium">cancellation policy</span>. Payment is required upfront and bookings can be cancelled up to 24 hours before the start date.
                </label>
              </div>
              {fieldErrors.terms && (
                <div className="text-sm text-red-600 -mt-4">{fieldErrors.terms}</div>
              )}

              <button
                type="submit"
                disabled={submitting || pricingBreakdown.total <= 0 || !isCapacityAvailable}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="h-6 w-6" />
                    <span>Review & Confirm Booking</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        </div>
        
        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowConfirmation(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Confirm Your Booking</h3>
                <p className="text-gray-600 mb-6">Please review the details before proceeding to payment</p>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Warehouse</h4>
                    <p className="text-gray-700">{warehouse.name}</p>
                    <p className="text-sm text-gray-600">{warehouse.location?.city}, {warehouse.location?.state}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Produce Details</h4>
                    <p className="text-gray-700 capitalize">{booking.produce.type.replace(/-/g, ' ')} - {booking.produce.quantity} {booking.produce.unit}</p>
                    <p className="text-sm text-gray-600 capitalize">Quality: {booking.produce.quality}</p>
                    {booking.produce.expectedHarvestDate && (
                      <p className="text-sm text-gray-600">Harvest Date: {new Date(booking.produce.expectedHarvestDate).toLocaleDateString()}</p>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Duration</h4>
                    <p className="text-gray-700">
                      {new Date(booking.bookingDates.startDate).toLocaleDateString()} - {new Date(booking.bookingDates.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">{duration} days</p>
                  </div>
                  
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Payment Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Base Amount:</span>
                        <span>₹{pricingBreakdown.baseAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Fee:</span>
                        <span>₹{pricingBreakdown.platformFee.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg text-emerald-700 border-t border-emerald-300 pt-2 mt-2">
                        <span>Total:</span>
                        <span>₹{pricingBreakdown.total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmBooking}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5" />
                        <span>Confirm & Pay</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




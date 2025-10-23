import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPinIcon, StarIcon, CheckIcon, CalendarIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import { gsap } from 'gsap';
import apiClient from '../services/apiClient';
import { toast } from 'react-hot-toast';
import BookingForm from '../components/BookingForm';

const WarehouseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchWarehouseDetails();
  }, [id]);

  useEffect(() => {
    if (warehouse) {
      gsap.fromTo('.warehouse-detail',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [warehouse]);

  const fetchWarehouseDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/warehouses/${id}`);
      
      if (response.data.success) {
        setWarehouse(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch warehouse details');
      }
    } catch (err) {
      console.error('Error fetching warehouse details:', err);
      setError(err.response?.data?.message || 'Failed to fetch warehouse details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      const response = await apiClient.post('/bookings', {
        ...bookingData,
        warehouseId: id
      });

      if (response.data.success) {
        toast.success('Booking request submitted successfully!');
        setShowBookingForm(false);
        navigate('/my-bookings');
      } else {
        toast.error(response.data.message || 'Failed to submit booking');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      toast.error(err.response?.data?.message || 'Failed to submit booking');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/warehouses')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Back to Warehouses
          </button>
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Warehouse Not Found</h2>
          <p className="text-gray-600 mb-4">The warehouse you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/warehouses')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Back to Warehouses
          </button>
        </div>
      </div>
    );
  }

  const images = warehouse.images || [];
  const amenities = warehouse.facilities || [];
  const pricing = warehouse.pricing || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 warehouse-detail">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <button
                  onClick={() => navigate('/warehouses')}
                  className="text-gray-700 hover:text-green-600"
                >
                  Warehouses
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-1 text-gray-500 md:ml-2">{warehouse.name}</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="warehouse-detail">
              <div className="relative">
                {images.length > 0 ? (
                  <div className="relative">
                    <img
                      src={images[currentImageIndex]}
                      alt={warehouse.name}
                      className="w-full h-96 object-cover rounded-lg shadow-lg"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">📦</div>
                      <p>No images available</p>
                    </div>
                  </div>
                )}
                
                {/* Image Thumbnails */}
                {images.length > 1 && (
                  <div className="flex space-x-2 mt-4 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ${
                          index === currentImageIndex ? 'ring-2 ring-green-500' : ''
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${warehouse.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Warehouse Info */}
            <div className="warehouse-detail bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{warehouse.name}</h1>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    <span>{warehouse.location?.address || 'Location not specified'}</span>
                  </div>
                  {warehouse.rating && (
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="ml-1 text-gray-600">{warehouse.rating.average || 0}/5</span>
                      <span className="ml-2 text-gray-500">({warehouse.rating.count || 0} reviews)</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">
                    ₹{pricing.basePrice || 0}
                    <span className="text-lg text-gray-500">/day</span>
                  </div>
                  {pricing.discount && (
                    <div className="text-sm text-red-600 line-through">
                      ₹{pricing.originalPrice}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {warehouse.description || 'No description available.'}
                </p>
              </div>
            </div>

            {/* Capacity & Features */}
            <div className="warehouse-detail bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity & Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Storage Capacity</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Capacity:</span>
                      <span className="font-medium">{warehouse.capacity?.total || 0} tons</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available:</span>
                      <span className="font-medium text-green-600">
                        {warehouse.capacity?.available || warehouse.capacity?.total || 0} tons
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storage Type:</span>
                      <span className="font-medium">{warehouse.storageTypes?.join(', ') || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Amenities</h4>
                  <div className="space-y-2">
                    {amenities.length > 0 ? (
                      amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-gray-600">{amenity}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No amenities listed</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="warehouse-detail sticky top-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Book This Warehouse</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per day:</span>
                    <span className="font-semibold">₹{pricing.basePrice || 0}</span>
                  </div>
                  {pricing.discount && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span className="font-semibold">{pricing.discount}% off</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleBookNow}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Book Now
                </button>

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Free cancellation up to 24 hours before booking
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form Modal */}
        {showBookingForm && (
          <BookingForm
            isOpen={showBookingForm}
            onClose={() => setShowBookingForm(false)}
            warehouse={warehouse}
            onBook={handleBookingSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default WarehouseDetails;


















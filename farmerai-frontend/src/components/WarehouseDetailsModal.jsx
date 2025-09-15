// src/components/WarehouseDetailsModal.jsx
import React, { useRef, useEffect } from 'react';
import { XMarkIcon, MapPinIcon, StarIcon, CalendarIcon, CurrencyRupeeIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { gsap } from 'gsap';

const WarehouseDetailsModal = ({ isOpen, onClose, warehouse, onBook }) => {
  const modalRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  const handleClose = () => {
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.2 });
    gsap.to(modalRef.current, 
      { y: 50, opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in' },
      () => onClose()
    );
  };

  const handleBookClick = () => {
    gsap.to(modalRef.current, {
      scale: 0.98,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
      onComplete: () => {
        onClose();
        onBook(warehouse);
      }
    });
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarSolidIcon key={i} className="h-5 w-5 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarIcon key={i} className="h-5 w-5 text-yellow-400" />);
      } else {
        stars.push(<StarIcon key={i} className="h-5 w-5 text-gray-300" />);
      }
    }
    return stars;
  };

  const getStorageTypeColor = (type) => {
    const colors = {
      'cold-storage': 'bg-blue-100 text-blue-800',
      'pest-control': 'bg-green-100 text-green-800',
      'temperature-control': 'bg-purple-100 text-purple-800',
      'general': 'bg-gray-100 text-gray-800',
      'refrigerated': 'bg-cyan-100 text-cyan-800',
      'frozen': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStorageTypeLabel = (type) => {
    const labels = {
      'cold-storage': 'Cold Storage',
      'pest-control': 'Pest Control',
      'temperature-control': 'Temperature Control',
      'general': 'General Storage',
      'refrigerated': 'Refrigerated',
      'frozen': 'Frozen Storage'
    };
    return labels[type] || type;
  };

  if (!isOpen || !warehouse) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{warehouse.name}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Images and Basic Info */}
            <div>
              {/* Images */}
              <div className="mb-6">
                {warehouse.images && warehouse.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <img
                        src={warehouse.images[0].url}
                        alt={warehouse.name}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                    {warehouse.images.slice(1, 5).map((image, index) => (
                      <img
                        key={index}
                        src={image.url}
                        alt={warehouse.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-64 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-6xl mb-2">🏭</div>
                      <div className="text-xl font-semibold">{warehouse.name}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
                <div className="flex items-start gap-2">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-900">{warehouse.location.address}</p>
                    <p className="text-gray-600">
                      {warehouse.location.city}, {warehouse.location.state} - {warehouse.location.pincode}
                    </p>
                    {warehouse.location.landmark && (
                      <p className="text-sm text-gray-500">Near {warehouse.location.landmark}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              {warehouse.owner && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Owner Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold">
                          {warehouse.owner.firstName?.[0]}{warehouse.owner.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {warehouse.owner.firstName} {warehouse.owner.lastName}
                        </p>
                        {warehouse.owner.warehouseOwnerProfile?.businessName && (
                          <p className="text-sm text-gray-600">
                            {warehouse.owner.warehouseOwnerProfile.businessName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600">
                      {warehouse.owner.phone && (
                        <div className="flex items-center gap-1">
                          <PhoneIcon className="h-4 w-4" />
                          <span>{warehouse.owner.phone}</span>
                        </div>
                      )}
                      {warehouse.owner.email && (
                        <div className="flex items-center gap-1">
                          <EnvelopeIcon className="h-4 w-4" />
                          <span>{warehouse.owner.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div>
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{warehouse.description}</p>
              </div>

              {/* Storage Types */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Storage Types</h3>
                <div className="flex flex-wrap gap-2">
                  {warehouse.storageTypes.map((type) => (
                    <span
                      key={type}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStorageTypeColor(type)}`}
                    >
                      {getStorageTypeLabel(type)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Capacity and Pricing */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Capacity & Pricing</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Capacity:</span>
                    <span className="font-medium">
                      {warehouse.capacity.total} {warehouse.capacity.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Available Capacity:</span>
                    <span className="font-medium text-green-600">
                      {warehouse.capacity.available} {warehouse.capacity.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price per day:</span>
                    <span className="font-medium text-green-600 flex items-center">
                      <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
                      {warehouse.pricing.basePrice}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Minimum rental:</span>
                    <span className="font-medium">
                      {warehouse.pricing.minimumDays} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Maximum rental:</span>
                    <span className="font-medium">
                      {warehouse.pricing.maximumDays} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Facilities */}
              {warehouse.facilities && warehouse.facilities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Facilities</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {warehouse.facilities.map((facility) => (
                      <div
                        key={facility}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{facility.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Operating Hours */}
              {warehouse.operatingHours && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Operating Hours</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Daily Hours:</span>
                      <span className="font-medium">
                        {warehouse.operatingHours.start} - {warehouse.operatingHours.end}
                      </span>
                    </div>
                    {warehouse.operatingHours.workingDays && (
                      <div>
                        <span className="text-gray-600 text-sm">Working Days:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {warehouse.operatingHours.workingDays.map((day) => (
                            <span
                              key={day}
                              className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                            >
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rating */}
              {warehouse.rating && warehouse.rating.average > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Rating</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {renderStars(warehouse.rating.average)}
                    </div>
                    <span className="text-lg font-medium text-gray-900">
                      {warehouse.rating.average}
                    </span>
                    <span className="text-gray-500">
                      ({warehouse.rating.count} reviews)
                    </span>
                  </div>
                </div>
              )}

              {/* Documents */}
              {warehouse.documents && warehouse.documents.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents</h3>
                  <div className="space-y-2">
                    {warehouse.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{doc.name}</span>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleBookClick}
              disabled={warehouse.status !== 'active'}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Book This Warehouse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseDetailsModal;






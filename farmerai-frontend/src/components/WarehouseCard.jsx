// src/components/WarehouseCard.jsx
import React, { useRef, useEffect, useState } from 'react';
import { MapPinIcon, StarIcon, CalendarIcon, CurrencyRupeeIcon, ShoppingCartIcon, HeartIcon, ShareIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { gsap } from 'gsap';
import { useBookingCart } from '../context/BookingCartContext';

const WarehouseCard = ({ 
  warehouse, 
  onBook, 
  onViewDetails, 
  isFavorited = false, 
  onToggleFavorite, 
  onShare,
  viewMode = 'grid' 
}) => {
  const cardRef = useRef(null);
  const { addToCart } = useBookingCart();

  useEffect(() => {
    // Animate card on mount
    gsap.fromTo(cardRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
    );
  }, []);

  const handleBookClick = () => {
    gsap.to(cardRef.current, {
      scale: 0.98,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
      onComplete: () => onBook(warehouse)
    });
  };

  const handleViewDetails = () => {
    gsap.to(cardRef.current, {
      scale: 1.02,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
      onComplete: () => onViewDetails(warehouse)
    });
  };

  const handleAddToCart = () => {
    // Create a basic booking data structure for the cart
    const bookingData = {
      produce: {
        type: '',
        quantity: 1,
        unit: 'kg',
        quality: 'good'
      },
      storageRequirements: {
        storageType: warehouse.storageTypes[0] || 'general'
      },
      bookingDates: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 7
      }
    };

    addToCart(warehouse, bookingData);
    
    // Animate the card to show it was added
    gsap.to(cardRef.current, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite();
    }
    
    // Animate the heart icon
    gsap.to(e.currentTarget, {
      scale: 1.2,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarSolidIcon key={i} className="h-4 w-4 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarIcon key={i} className="h-4 w-4 text-yellow-400" />);
      } else {
        stars.push(<StarIcon key={i} className="h-4 w-4 text-gray-300" />);
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

  const hasDiscount = typeof warehouse?.pricing?.seasonalMultiplier === 'number' && warehouse.pricing.seasonalMultiplier > 0 && warehouse.pricing.seasonalMultiplier < 1;
  const discountPercent = hasDiscount ? Math.round((1 - warehouse.pricing.seasonalMultiplier) * 100) : null;

  return (
    <div
      ref={cardRef}
      className="group rounded-2xl shadow-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 border border-white/30 bg-white/30 backdrop-blur-md hover:bg-white/40 hover:shadow-2xl"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-green-400 to-green-600 overflow-hidden">
        {warehouse.images && warehouse.images.length > 0 ? (
          <img
            src={warehouse.images[0].url}
            alt={warehouse.name}
            className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-center">
              <div className="text-4xl mb-2">🏭</div>
              <div className="text-lg font-semibold">{warehouse.name}</div>
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all duration-200"
              title="Share warehouse"
            >
              <ShareIcon className="h-5 w-5 text-gray-600" />
            </button>
          )}
          <button
            onClick={handleToggleFavorite}
            className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all duration-200"
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorited ? (
              <HeartSolidIcon className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            warehouse.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {warehouse.status === 'active' ? 'Available' : 'Unavailable'}
          </span>
        </div>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-4 left-4">
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
              {discountPercent}% OFF
            </span>
          </div>
        )}

        {/* Rating */}
        {warehouse.rating && warehouse.rating.average > 0 && (
          <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 border border-white/50">
            <StarSolidIcon className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium">{warehouse.rating.average}</span>
            <span className="text-xs text-gray-500">({warehouse.rating.count})</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Name and Location */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 drop-shadow-sm">{warehouse.name}</h3>
          <div className="flex items-center text-gray-700">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">
              {warehouse.location.city}, {warehouse.location.state}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
          {warehouse.description}
        </p>

        {/* Storage Types */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {warehouse.storageTypes.slice(0, 3).map((type) => (
              <span
                key={type}
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStorageTypeColor(type)}`}
              >
                {getStorageTypeLabel(type)}
              </span>
            ))}
            {warehouse.storageTypes.length > 3 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{warehouse.storageTypes.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Capacity and Pricing */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Available Capacity:</span>
            <span className="font-semibold text-gray-900">
              {warehouse.capacity.available} {warehouse.capacity.unit}
            </span>
          </div>
          <div className="rounded-lg p-3 border border-white/40 bg-white/40 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-700">Starting from</div>
                <div className="text-lg font-bold text-green-700 flex items-center">
                  <CurrencyRupeeIcon className="h-5 w-5 mr-1" />
                  {warehouse.pricing.basePrice}
                  <span className="text-sm font-normal text-gray-500 ml-1">/day</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Per ton</div>
                <div className="text-sm font-medium text-gray-700">
                  {warehouse.pricing.minimumDays || 1} day min
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Facilities */}
        {warehouse.facilities && warehouse.facilities.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">Facilities:</div>
            <div className="flex flex-wrap gap-1">
              {warehouse.facilities.slice(0, 3).map((facility) => (
                <span
                  key={facility}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {facility.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              ))}
              {warehouse.facilities.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  +{warehouse.facilities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Owner Info */}
        {warehouse.owner && (
          <div className="mb-4 p-3 rounded-lg border border-white/40 bg-white/40 backdrop-blur-sm">
            <div className="text-sm text-gray-600 mb-1">Owner:</div>
            <div className="font-medium text-gray-900">
              {warehouse.owner.firstName} {warehouse.owner.lastName}
            </div>
            {warehouse.owner.warehouseOwnerProfile && (
              <div className="text-sm text-gray-600">
                {warehouse.owner.warehouseOwnerProfile.businessName}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={handleViewDetails}
              className="flex-1 px-4 py-2 border border-white/40 rounded-lg text-gray-800 hover:bg-white/40 backdrop-blur-sm transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </button>
            <button
              onClick={handleAddToCart}
              disabled={warehouse.status !== 'active'}
              className="px-4 py-2 bg-blue-600/90 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center shadow-md"
              title="Add to Cart"
            >
              <ShoppingCartIcon className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleBookClick}
            disabled={warehouse.status !== 'active'}
            className="w-full px-4 py-3 bg-green-600/90 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            {warehouse.status !== 'active' ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Not Available
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Rent This Space
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarehouseCard;

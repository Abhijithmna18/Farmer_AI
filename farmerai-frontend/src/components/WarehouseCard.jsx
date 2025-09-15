// src/components/WarehouseCard.jsx
import React, { useRef, useEffect } from 'react';
import { MapPinIcon, StarIcon, CalendarIcon, CurrencyRupeeIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { gsap } from 'gsap';
import { useBookingCart } from '../context/BookingCartContext';

const WarehouseCard = ({ warehouse, onBook, onViewDetails }) => {
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
      className="group bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
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
        <div className="absolute top-4 right-4">
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
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-full px-2 py-1 flex items-center gap-1">
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{warehouse.name}</h3>
          <div className="flex items-center text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">
              {warehouse.location.city}, {warehouse.location.state}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
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
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Capacity:</span>
            <span className="font-medium">
              {warehouse.capacity.available} {warehouse.capacity.unit}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Price:</span>
            <span className="font-medium text-green-600 flex items-center">
              <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
              {warehouse.pricing.basePrice}
              {warehouse.pricing.pricePerUnit === 'per_ton' ? '/ton' : '/day'}
            </span>
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
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
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
        <div className="flex gap-2">
          <button
            onClick={handleViewDetails}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            View Details
          </button>
          <button
            onClick={handleAddToCart}
            disabled={warehouse.status !== 'active'}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
            title="Add to Cart"
          >
            <ShoppingCartIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleBookClick}
            disabled={warehouse.status !== 'active'}
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarehouseCard;

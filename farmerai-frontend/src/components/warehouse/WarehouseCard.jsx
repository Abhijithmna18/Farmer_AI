import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, CalendarIcon, CurrencyRupeeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const WarehouseCard = ({ warehouse }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48">
        {warehouse.images && warehouse.images.length > 0 ? (
          <img
            src={warehouse.images[0]}
            alt={warehouse.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">No Image Available</span>
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
          {warehouse.status === 'available' ? 'Available' : 'Booked'}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{warehouse.name}</h3>
        
        <div className="flex items-center text-gray-600 text-sm mb-2">
          <MapPinIcon className="h-4 w-4 mr-1" />
          <span>{warehouse.location.city}, {warehouse.location.state}</span>
        </div>
        
        <div className="flex items-center text-gray-600 text-sm mb-3">
          <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
          <span>₹{warehouse.pricePerDay?.toLocaleString()} / day</span>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {warehouse.amenities?.slice(0, 3).map((amenity, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {amenity}
            </span>
          ))}
          {warehouse.amenities?.length > 3 && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
              +{warehouse.amenities.length - 3} more
            </span>
          )}
        </div>
        
        <Link
          to={`/warehouses/${warehouse._id}`}
          className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          <span>View Details</span>
          <ArrowRightIcon className="h-4 w-4 ml-2" />
        </Link>
      </div>
    </div>
  );
};

export default WarehouseCard;

import React, { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, MapPinIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

const WarehouseFilters = ({ onChange, initial = {} }) => {
  const [search, setSearch] = useState(initial.search || '');
  const [location, setLocation] = useState(initial.location || '');
  const [minPrice, setMinPrice] = useState(initial.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice || '');
  const [storageTypes, setStorageTypes] = useState(initial.storageTypes || []);
  const [availability, setAvailability] = useState(initial.availability || 'any');
  const [sortBy, setSortBy] = useState(initial.sortBy || 'createdAt');
  const [sortOrder, setSortOrder] = useState(initial.sortOrder || 'desc');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const typeOptions = [
    { value: 'cold-storage', label: 'Cold Storage' },
    { value: 'dry-storage', label: 'Dry Storage' },
    { value: 'refrigerated', label: 'Refrigerated' },
    { value: 'frozen', label: 'Frozen' },
    { value: 'temperature-control', label: 'Temperature Control' },
    { value: 'pest-control', label: 'Pest Control' },
    { value: 'general', label: 'General' },
  ];

  const emit = (next = {}) => {
    onChange?.({
      search,
      location,
      minPrice,
      maxPrice,
      storageTypes,
      availability,
      sortBy,
      sortOrder,
      ...next,
    });
  };

  const toggleType = (value) => {
    const next = storageTypes.includes(value)
      ? storageTypes.filter((t) => t !== value)
      : [...storageTypes, value];
    setStorageTypes(next);
    emit({ storageTypes: next });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && emit()}
            placeholder="Search warehouses..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Location */}
        <div className="relative w-full lg:w-64">
          <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => { setLocation(e.target.value); emit({ location: e.target.value }); }}
            placeholder="City, state..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); emit({ sortBy: e.target.value }); }}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="createdAt">Newest</option>
            <option value="pricing.basePrice">Price</option>
            <option value="rating.average">Rating</option>
            <option value="capacity.total">Capacity</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value); emit({ sortOrder: e.target.value }); }}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
          Filters
        </button>

        {/* Apply */}
        <button
          type="button"
          onClick={() => emit()}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Search
        </button>
      </div>

      {showAdvanced && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Price */}
          <div className="flex gap-2">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => { setMinPrice(e.target.value); emit({ minPrice: e.target.value }); }}
              placeholder="Min price"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => { setMaxPrice(e.target.value); emit({ maxPrice: e.target.value }); }}
              placeholder="Max price"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Availability */}
          <select
            value={availability}
            onChange={(e) => { setAvailability(e.target.value); emit({ availability: e.target.value }); }}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="any">Any Availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>

          {/* Types */}
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => toggleType(t.value)}
                className={`px-3 py-1.5 rounded-full border text-sm ${
                  storageTypes.includes(t.value)
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseFilters;




















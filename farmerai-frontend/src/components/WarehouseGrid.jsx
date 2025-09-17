import React from 'react';
import WarehouseCard from './WarehouseCard';

const WarehouseGrid = ({ warehouses = [], onBook, onViewDetails }) => {
  if (!warehouses || warehouses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏭</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No warehouses found</h3>
        <p className="text-gray-600">Try adjusting your search criteria or location</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {warehouses.map((warehouse) => (
        <WarehouseCard
          key={warehouse._id}
          warehouse={warehouse}
          onBook={onBook}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};

export default WarehouseGrid;







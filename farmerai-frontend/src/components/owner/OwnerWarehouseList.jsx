import React from 'react';

export default function OwnerWarehouseList({ warehouses = [], onEdit, onDelete, onToggle }) {
  if (!warehouses.length) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center text-gray-600">No warehouses yet. Click "Add Warehouse" to create one.</div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Location</th>
            <th className="px-4 py-3 text-left">Capacity</th>
            <th className="px-4 py-3 text-left">Price</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {warehouses.map((w) => (
            <tr key={w._id} className="border-t">
              <td className="px-4 py-3 font-medium">{w.name}</td>
              <td className="px-4 py-3 text-gray-600">{w?.location?.city}, {w?.location?.state}</td>
              <td className="px-4 py-3 text-gray-600">{w?.capacity?.available} {w?.capacity?.unit}</td>
              <td className="px-4 py-3 text-gray-900">₹{w?.pricing?.basePrice}/{w?.pricing?.pricePerUnit === 'per_ton' ? 'ton' : 'day'}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs ${w.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {w.isAvailable ? 'Open' : 'Closed'}
                </span>
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                <button onClick={() => onToggle?.(w)} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Toggle</button>
                <button onClick={() => onEdit?.(w)} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Edit</button>
                <button onClick={() => onDelete?.(w)} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}





















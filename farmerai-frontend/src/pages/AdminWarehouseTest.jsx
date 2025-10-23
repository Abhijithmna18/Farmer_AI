// Minimal test component
import React from 'react';

const AdminWarehouseTest = () => {
  console.log('AdminWarehouseTest component loaded!');
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Admin Warehouse Dashboard - Test Page
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-700">
            ✅ If you can see this, the route is working!
          </p>
          <p className="text-gray-600 mt-4">
            This is a test component to verify the admin warehouse route is functioning.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminWarehouseTest;

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import OwnerLayout from './Layout/OwnerLayout';
import OwnerOverview from './Overview.jsx';
import OwnerWarehouses from './Warehouses.jsx';
import OwnerBookings from './BookingRequests.jsx';
import OwnerRevenue from './RevenueReports.jsx';
import OwnerSettings from './Settings.jsx';
import OwnerCustomers from './Customers.jsx';
import OwnerInventory from './Inventory.jsx';
import OwnerAnalytics from './Analytics.jsx';
import OwnerReports from './Reports.jsx';

export default function OwnerRouter(){
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={['warehouse-owner']} />}> 
        <Route element={<OwnerLayout />}> 
          <Route index element={<OwnerOverview />} />
          <Route path="dashboard" element={<OwnerOverview />} />
          <Route path="warehouses" element={<OwnerWarehouses />} />
          <Route path="bookings" element={<OwnerBookings />} />
          <Route path="inventory" element={<OwnerInventory />} />
          <Route path="analytics" element={<OwnerAnalytics />} />
          <Route path="reports" element={<OwnerReports />} />
          <Route path="customers" element={<OwnerCustomers />} />
          <Route path="revenue" element={<OwnerRevenue />} />
          <Route path="settings" element={<OwnerSettings />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}



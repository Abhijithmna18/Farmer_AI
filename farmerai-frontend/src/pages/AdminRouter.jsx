import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AdminLayout from './Admin/layout/AdminLayout';
import AdminHome from './Admin/AdminDashboard';
import ProfessionalAdminDashboard from './Admin/ProfessionalAdminDashboard';
import UsersPage from './Admin/sections/UsersPage';
import EventsPage from './Admin/sections/EventsPage';
import ContactsPage from './Admin/sections/ContactsPage';
import ProductsPage from './Admin/sections/ProductsPage';
import CalendarPage from './Admin/sections/CalendarPage';
import SettingsPage from './Admin/sections/SettingsPage';
import AdminCommunity from './AdminCommunity';
import PendingFarmers from '../components/admin/PendingFarmers';
import CommunityRequests from '../components/admin/CommunityRequests';
import AdminFeedback from './Admin/AdminFeedback';
import AdminWarehouseDashboard from './AdminWarehouseDashboard';
import AdminWarehouseTest from './AdminWarehouseTest';

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; // Let global loader handle
  if (!user || (user.role !== 'admin' && !(user.roles || []).includes('admin'))) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function AdminRouter(){
  return (
    <Routes>
      <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}> 
        <Route path="dashboard" element={<ProfessionalAdminDashboard />} />
        <Route path="dashboard-old" element={<AdminHome />} />
        <Route path="dashboard/users" element={<UsersPage />} />
        <Route path="dashboard/events" element={<EventsPage />} />
        <Route path="dashboard/contacts" element={<ContactsPage />} />
        <Route path="dashboard/products" element={<ProductsPage />} />
        <Route path="dashboard/calendar" element={<CalendarPage />} />
        <Route path="growth-calendar" element={<CalendarPage />} />
        <Route path="dashboard/settings" element={<SettingsPage />} />
        <Route path="community" element={<AdminCommunity />} />
        <Route path="community-requests" element={<CommunityRequests />} />
        <Route path="feedback" element={<AdminFeedback />} />
        <Route path="warehouse" element={<AdminWarehouseDashboard />} />
        <Route path="pending-farmers" element={<PendingFarmers />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" />} />
      </Route>
    </Routes>
  );
}
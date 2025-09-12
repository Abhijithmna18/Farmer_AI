import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './Admin/layout/AdminLayout';
import AdminHome from './Admin/AdminDashboard';
import UsersPage from './Admin/sections/UsersPage';
import EventsPage from './Admin/sections/EventsPage';
import ContactsPage from './Admin/sections/ContactsPage';
import ProductsPage from './Admin/sections/ProductsPage';
import CalendarPage from './Admin/sections/CalendarPage';
import SettingsPage from './Admin/sections/SettingsPage';

export default function AdminRouter(){
  return (
    <Routes>
      <Route element={<AdminLayout />}> 
        <Route path="dashboard" element={<AdminHome />} />
        <Route path="dashboard/users" element={<UsersPage />} />
        <Route path="dashboard/events" element={<EventsPage />} />
        <Route path="dashboard/contacts" element={<ContactsPage />} />
        <Route path="dashboard/products" element={<ProductsPage />} />
        <Route path="dashboard/calendar" element={<CalendarPage />} />
        <Route path="dashboard/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" />} />
      </Route>
    </Routes>
  );
}
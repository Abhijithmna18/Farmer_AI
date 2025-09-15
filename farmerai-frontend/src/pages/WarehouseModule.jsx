// src/pages/WarehouseModule.jsx
import React from 'react';
import useAuth from '../hooks/useAuth';
import WarehouseListing from './WarehouseListing';
import WarehouseOwnerDashboard from './WarehouseOwnerDashboard';

const WarehouseModule = () => {
  const { user } = useAuth();
  const isOwner = (user?.role === 'warehouse-owner') || (Array.isArray(user?.roles) && user.roles.includes('warehouse-owner')) || user?.userType === 'warehouse-owner';
  if (isOwner) return <WarehouseOwnerDashboard />;
  return <WarehouseListing />;
};

export default WarehouseModule;

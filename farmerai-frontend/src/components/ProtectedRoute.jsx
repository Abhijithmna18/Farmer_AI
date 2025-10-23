import React, { useContext, useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../services/apiClient';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const validate = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // No session token, immediately mark unauthorized
        if (!cancelled) {
          setAuthorized(false);
          setChecking(false);
        }
        return;
      }
      try {
        // If AuthContext already loaded and has a user, still validate with backend
        await apiClient.get('/auth/me');
        if (!cancelled) setAuthorized(true);
      } catch (_) {
        // invalid/expired token
        localStorage.removeItem('token');
        if (!cancelled) setAuthorized(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    validate();
    return () => { cancelled = true; };
  }, []);

  if (loading || checking) {
    return <div className="flex justify-center items-center min-h-screen text-white">Loading authentication...</div>;
  }

  if (!authorized) {
    const params = new URLSearchParams(window.location.search);
    const from = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    return <Navigate to={`/login?redirect=${encodeURIComponent(from)}`} replace />;
  }

  if (allowedRoles && user) {
    const userRole = user.role || (Array.isArray(user.roles) && user.roles.includes('admin') ? 'admin' : 'farmer');
    const storedRole = localStorage.getItem('role');
    const hasRole = allowedRoles.some(role => userRole === role || storedRole === role);
    if (!hasRole) {
      return <div className="flex justify-center items-center min-h-screen text-red-500 text-xl">Access Denied. You do not have permission to view this page.</div>;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
import React, { useContext, useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../services/apiClient';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, setUser } = useContext(AuthContext);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const validate = async () => {
      try {
        // If AuthContext already loaded and has a user, still validate with backend
        await apiClient.get('/auth/me');
        if (!cancelled) {
          if (!user) {
            // backend says valid; ensure at least minimal user state
            const email = localStorage.getItem('email');
            const role = localStorage.getItem('role');
            setUser && setUser(email ? { email, role } : {});
          }
          setAuthorized(true);
        }
      } catch (_) {
        // invalid/expired token
        localStorage.removeItem('token');
        // keep role/email only if you prefer soft-persistence; otherwise clear
        // localStorage.removeItem('role');
        if (!cancelled) setAuthorized(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    validate();
    return () => { cancelled = true; };
  }, [user, setUser]);

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
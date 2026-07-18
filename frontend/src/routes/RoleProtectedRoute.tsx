import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const RoleProtectedRoute: React.FC<{ permittedRoles: string[] }> = ({ permittedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="loading-spinner lg" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!permittedRoles.includes(user?.role || '')) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

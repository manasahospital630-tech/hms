import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const RoleProtectedRoute: React.FC<{ permittedRoles: string[] }> = ({ permittedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="loading-spinner lg" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const userRole = (user?.role || '').trim().toUpperCase();
  const allowedRoles = permittedRoles.map(r => r.trim().toUpperCase());

  // Allow access if role matches case-insensitively or if user is ADMIN / SUPER_ADMIN / MANAGEMENT
  const isAllowed = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'MANAGEMENT' || allowedRoles.includes(userRole);

  if (!isAllowed) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Map of route path prefixes to module keys (mirrors Sidebar pathToModuleKey)
const routeToModuleKey: Record<string, string> = {
  '/admin/dashboard': 'dashboard',
  '/admin/users': 'admin_users',
  '/admin/settings': 'admin_master_config',
  '/reception/register': 'patients_reg',
  '/reception/patients': 'patients_history',
  '/reception/opcheckin': 'op_checkin',
  '/reception/appointments': 'appointments_booking',
  '/reception/queue': 'appointments_queues',
  '/doctor/emergency': 'emergency_mgmt',
  '/doctor/dashboard': 'doctor_opd',
  '/doctor/history': 'patient_timeline',
  '/doctor/consultation': 'doctor_opd',
  '/nurse/triage': 'appointments_queues',
  '/nurse/vitals': 'appointments_queues',
  '/inpatient/admission': 'ipd_admission',
  '/inpatient/dashboard': 'ipd_billing',
  '/inpatient/beds': 'ipd_billing',
  '/diagnostics/dashboard': 'diag_dashboard',
  '/diagnostics/workspaces': 'diag_workspaces',
  '/diagnostics/catalog': 'diag_catalog',
  '/diagnostics/billing': 'diag_ref_ranges',
  '/diagnostics/equipment': 'diag_equipment',
  '/pharmacy/inventory': 'pharmacy_inventory',
  '/pharmacy/dispense': 'pharmacy_sales',
  '/pharmacy/sales': 'pharmacy_sales',
  '/billing/invoices': 'billing_financials',
  '/billing/payments': 'billing_financials',
  '/admin/consultations': 'doctor_opd',
};

const getModuleKeyForPath = (pathname: string): string | null => {
  if (routeToModuleKey[pathname]) return routeToModuleKey[pathname];
  const prefix = Object.keys(routeToModuleKey).find(k => pathname.startsWith(k));
  return prefix ? routeToModuleKey[prefix] : null;
};

export const RoleProtectedRoute: React.FC<{ permittedRoles: string[] }> = ({ permittedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading-page"><div className="loading-spinner lg" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const userRole = (user?.role || '').trim().toUpperCase();
  const allowedRoles = permittedRoles.map(r => r.trim().toUpperCase());

  const isRoleAllowed = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'MANAGEMENT' || allowedRoles.includes(userRole);
  if (!isRoleAllowed) return <Navigate to="/unauthorized" replace />;

  // RBAC is_hidden / can_view check — applies to ALL roles including Admin.
  // Only skip if no permissions matrix is set at all (unassigned user).
  const permissions = (user as any)?.permissions;
  if (permissions && Object.keys(permissions).length > 0) {
    const modKey = getModuleKeyForPath(location.pathname);
    if (modKey) {
      const perm = permissions[modKey];
      if (perm) {
        if (perm.is_hidden) {
          // Module explicitly hidden → redirect to dashboard with access-denied banner
          return <Navigate to="/dashboard" replace state={{ accessDenied: true, reason: 'hidden' }} />;
        }
        if (perm.can_view === false) {
          return <Navigate to="/unauthorized" replace />;
        }
      }
    }
  }

  return <Outlet />;
};

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ShieldOff, X } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [accessDeniedBanner, setAccessDeniedBanner] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const state = location.state as any;
    if (state?.accessDenied) {
      setAccessDeniedBanner(true);
      const timer = setTimeout(() => setAccessDeniedBanner(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  return (
    <div className={`dashboard-layout ${!sidebarOpen ? 'collapsed' : ''}`}>
      <Sidebar collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="main-content">
        {accessDeniedBanner && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(239,68,68,0.08))',
            border: '1px solid rgba(249,115,22,0.35)',
            borderRadius: '8px', padding: '12px 16px',
            marginBottom: '16px', fontSize: '13px', color: '#f97316',
            fontWeight: 600, animation: 'fadeIn 0.3s ease'
          }}>
            <ShieldOff size={18} />
            <span style={{ flex: 1 }}>
              <strong>Access Restricted:</strong> The page you tried to access is hidden or restricted by your security role. Contact your administrator to request access.
            </span>
            <button onClick={() => setAccessDeniedBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f97316' }}>
              <X size={16} />
            </button>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
};

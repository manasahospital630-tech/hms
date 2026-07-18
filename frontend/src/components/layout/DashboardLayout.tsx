import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  return (
    <div className={`dashboard-layout ${!sidebarOpen ? 'collapsed' : ''}`}>
      <Sidebar collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import GuildSidebar from '../components/navigation/GuildSidebar';
import { useUIStore } from '../store/useUIStore';

const Layout: React.FC = () => {
  const { mobileSidebarOpen, closeMobileSidebar } = useUIStore();
  const location = useLocation();

  // Auto-close mobile sidebar when navigating (switching channels/servers)
  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname]);

  return (
    <div className={`app-container ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
      {/* 1. Leftmost Guild Navigation Bar */}
      <GuildSidebar />
      
      {/* Mobile Backdrop to close sidebars */}
      {mobileSidebarOpen && <div className="mobile-backdrop" onClick={closeMobileSidebar}></div>}

      {/* 2. Main content area (Sidebars + Main View depending on the route) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
        {/* The Outlet renders whatever child route is active. 
            For example, it might contain the secondary Channel/DM sidebar PLUS the Chat UI */}
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;

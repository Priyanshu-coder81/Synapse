import React from 'react';
import { Outlet } from 'react-router-dom';
import GuildSidebar from '../components/navigation/GuildSidebar';

const Layout: React.FC = () => {
  return (
    <div className="app-container">
      {/* 1. Leftmost Guild Navigation Bar */}
      <GuildSidebar />
      
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

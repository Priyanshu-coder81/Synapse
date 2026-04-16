import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './layout/Layout';
import DmHub from './pages/DmHub';
import GuildView from './pages/GuildView';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Main App Layout */}
        <Route path="/" element={<Layout />}>
          {/* Redirect base to DM Hub */}
          <Route index element={<Navigate to="/channels/@me" replace />} />
          
          {/* Direct Messages / Friends Hub */}
          <Route path="channels/@me" element={<DmHub />} />
          
          {/* Server View */}
          <Route path="channels/:guildId" element={<GuildView />} />
          <Route path="channels/:guildId/:channelId" element={<GuildView />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

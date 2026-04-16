import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './layout/Layout';
import DmHub from './pages/DmHub';
import DmView from './pages/DmView';
import GuildView from './pages/GuildView';
import UserProfile from './pages/UserProfile';
import ExplorePage from './pages/ExplorePage';
import { useAuthStore } from './store/useAuthStore';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes: Don't allow logged-in users to hit them */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/channels/@me" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/channels/@me" replace /> : <Register />} />
        
        {/* Fullscreen Protected Views */}
        <Route path="/settings" element={<PrivateRoute><UserProfile /></PrivateRoute>} />

        {/* Protected App Layout */}
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          {/* Redirect base to DM Hub */}
          <Route index element={<Navigate to="/channels/@me" replace />} />
          
          {/* Direct Messages / Friends Hub */}
          <Route path="channels/@me" element={<DmHub />} />
          <Route path="channels/@me/:channelId" element={<DmView />} />
          
          {/* Explore Servers (separate full page with layout) */}
          <Route path="explore" element={<ExplorePage />} />

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

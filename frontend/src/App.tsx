import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './layout/Layout';
import DmHub from './pages/DmHub';

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
          
          {/* Stage 2: Direct Messages / Friends Hub */}
          <Route path="channels/@me" element={<DmHub />} />
          
          {/* Stage 3: Server View Placeholders */}
          <Route path="channels/:guildId" element={
             <div style={{ padding: '24px', color: 'var(--text-header)' }}>
                <h1>Server View Base</h1>
                <p style={{ color: 'var(--text-muted)' }}>We selected a Guild. Stage 3 will build out the secondary sidebar and chat area for this view!</p>
             </div>
          } />
          <Route path="channels/:guildId/:channelId" element={
            <div style={{ padding: '24px', color: 'var(--text-header)' }}>
              <h1>Server Text Channel View</h1>
              <p style={{ color: 'var(--text-muted)' }}>We selected a text channel inside a Guild. Stage 3 will build this view!.</p>
            </div>
          } />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

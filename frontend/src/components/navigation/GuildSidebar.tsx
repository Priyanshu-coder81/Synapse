import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, Compass } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import JoinServerModal from '../guild/JoinServerModal';
import './Sidebar.css';

const GuildSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { myServers, fetchMyServers } = useServerStore();
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    fetchMyServers();
  }, []);

  return (
    <>
      <nav className="guild-sidebar">
        {/* Home Button (Direct Messages) */}
        <div className="guild-item-wrapper">
          <div className={`guild-pill ${location.pathname.startsWith('/channels/@me') ? 'active' : 'inactive'}`} />
          <NavLink 
            to="/channels/@me" 
            className={({ isActive }) => `guild-icon ${isActive ? 'active' : ''}`}
          >
            <MessageSquare size={28} />
          </NavLink>
        </div>

        <div className="guild-separator" />

        {/* Dynamic Servers from API */}
        {myServers.map((server) => {
          const isActive = location.pathname.includes(`/channels/${server.id}`);
          return (
            <div className="guild-item-wrapper" key={server.id}>
              <div className={`guild-pill ${isActive ? 'active' : 'inactive'}`} />
              <NavLink 
                to={`/channels/${server.id}`} 
                className={() => `guild-icon ${isActive ? 'active' : ''}`}
                title={server.name}
              >
                {server.icon || server.name.substring(0, 1)}
              </NavLink>
            </div>
          );
        })}

        <div className="guild-separator" />

        {/* Add Server Button */}
        <div className="guild-item-wrapper">
          <button className="guild-icon add-server-btn" onClick={() => setShowJoinModal(true)} title="Join a Server">
            <Plus size={24} />
          </button>
        </div>
        
        {/* Explore Servers Button */}
        <div className="guild-item-wrapper">
          <button className="guild-icon discover-btn" onClick={() => navigate('/explore')} title="Explore Servers">
            <Compass size={24} />
          </button>
        </div>
      </nav>

      {showJoinModal && <JoinServerModal onClose={() => { setShowJoinModal(false); fetchMyServers(); }} />}
    </>
  );
};

export default GuildSidebar;

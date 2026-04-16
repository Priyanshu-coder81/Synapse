import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MessageSquare, Plus, Compass } from 'lucide-react';
import './Sidebar.css';

const GuildSidebar: React.FC = () => {
  const location = useLocation();

  // Mock servers for UI purposes
  const servers = [
    { id: '1', name: 'Spring Boot User Group', img: '' },
    { id: '2', name: 'React Developers', img: '' },
    { id: '3', name: 'Synapse Dev Logs', img: '' }
  ];

  return (
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

      {/* Mock Servers */}
      {servers.map((server) => {
        const isActive = location.pathname.includes(`/channels/${server.id}`);
        return (
          <div className="guild-item-wrapper" key={server.id}>
            <div className={`guild-pill ${isActive ? 'active' : 'inactive'}`} />
            <NavLink 
              to={`/channels/${server.id}`} 
              className={({ isActive }) => `guild-icon ${isActive ? 'active' : ''}`}
              title={server.name}
            >
              {server.img ? (
                <img src={server.img} alt={server.name} />
              ) : (
                server.name.substring(0, 1)
              )}
            </NavLink>
          </div>
        );
      })}

      <div className="guild-separator" />

      {/* Add Server Button */}
      <div className="guild-item-wrapper">
        <button className="guild-icon add-server-btn">
          <Plus size={24} />
        </button>
      </div>
      
      {/* Explore Servers Button */}
      <div className="guild-item-wrapper">
        <button className="guild-icon discover-btn">
          <Compass size={24} />
        </button>
      </div>
    </nav>
  );
};

export default GuildSidebar;

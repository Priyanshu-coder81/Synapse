import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, Compass } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import JoinServerModal from '../guild/JoinServerModal';
import CreateServerModal from '../guild/CreateServerModal';
import './Sidebar.css';

const GuildSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { myServers, fetchMyServers } = useServerStore();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchMyServers();
  }, []);

  return (
    <>
      <nav className="guild-sidebar">
        {/* Home Button (Direct Messages) */}
        <div className="guild-item-wrapper">
          <div className={`guild-pill ${location.pathname.startsWith('/channels/@me') ? 'active' : 'inactive'}`} />
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink 
                to="/channels/@me" 
                className={({ isActive }) => `guild-icon ${isActive ? 'active' : ''}`}
              >
                <MessageSquare size={28} />
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-semibold">
              Direct Messages
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="guild-separator" />

        {/* Dynamic Servers from API */}
        {myServers.map((server) => {
          const isActive = location.pathname.includes(`/channels/${server.id}`);
          return (
            <div className="guild-item-wrapper" key={server.id}>
              <div className={`guild-pill ${isActive ? 'active' : 'inactive'}`} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink 
                    to={`/channels/${server.id}`} 
                    className={() => `guild-icon ${isActive ? 'active' : ''}`}
                  >
                    {server.icon || server.name.substring(0, 1)}
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-semibold">
                  {server.name}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}

        <div className="guild-separator" />

        {/* Add Server — Dropdown with Create / Join */}
        <div className="guild-item-wrapper">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button className="guild-icon add-server-btn">
                    <Plus size={24} />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-semibold">
                Add a Server
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="right" align="start" className="w-52">
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} />
                Create My Own
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => setShowJoinModal(true)}
              >
                <Compass size={16} />
                Join a Server
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Explore Servers Button */}
        <div className="guild-item-wrapper">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="guild-icon discover-btn" onClick={() => navigate('/explore')}>
                <Compass size={24} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-semibold">
              Explore Servers
            </TooltipContent>
          </Tooltip>
        </div>
      </nav>

      {showJoinModal && <JoinServerModal onClose={() => { setShowJoinModal(false); fetchMyServers(); }} />}
      <CreateServerModal 
        isOpen={showCreateModal} 
        onClose={() => { setShowCreateModal(false); fetchMyServers(); }} 
      />
    </>
  );
};

export default GuildSidebar;

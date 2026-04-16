import React from 'react';
import { Hash, ChevronDown, Mic, Headphones, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import './ChannelSidebar.css';

const ChannelSidebar: React.FC = () => {
    // Dynamic user retrieval from Stage 4 store
    const { username, logout } = useAuthStore();
    const navigate = useNavigate();
    
    return (
        <aside className="channel-sidebar">
            <div className="channel-sidebar-header">
                <div>Spring Boot User Group</div>
                <ChevronDown size={18} />
            </div>
            
            <div className="channel-section" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="channel-category">TEXT CHANNELS</div>
                <div className="channel-item active">
                    <Hash size={20} color="var(--text-muted)"/>
                    general
                </div>
                <div className="channel-item">
                    <Hash size={20} color="var(--text-muted)"/>
                    announcements
                </div>
                <div className="channel-item">
                    <Hash size={20} color="var(--text-muted)"/>
                    backend-help
                </div>
            </div>

            {/* Stage 6 Polish: The User Control Dock */}
            <div className="user-profile-panel">
                 <div className="user-profile-avatar">
                     {username ? username.charAt(0).toUpperCase() : 'U'}
                     <div className="user-profile-status" />
                 </div>
                 <div className="user-profile-info">
                     <div className="user-name">{username || 'User'}</div>
                     <div className="user-tag">Online</div>
                 </div>
                 <div className="user-profile-controls">
                     <Mic size={20} className="control-icon" />
                     <Headphones size={20} className="control-icon" />
                     <Settings size={20} className="control-icon" onClick={() => navigate('/settings')} title="User Settings" />
                 </div>
            </div>
        </aside>
    );
};

export default ChannelSidebar;

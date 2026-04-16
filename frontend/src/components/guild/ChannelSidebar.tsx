import React, { useEffect } from 'react';
import { Hash, ChevronDown, Mic, Headphones, Settings } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useServerStore } from '../../store/useServerStore';
import './ChannelSidebar.css';

const ChannelSidebar: React.FC = () => {
    const { username } = useAuthStore();
    const navigate = useNavigate();
    const { guildId, channelId } = useParams<{ guildId: string; channelId?: string }>();
    const { currentServer, fetchServerDetails } = useServerStore();

    useEffect(() => {
        if (guildId) {
            fetchServerDetails(guildId);
        }
    }, [guildId]);
    
    const channels = currentServer?.channels || [];
    const serverName = currentServer?.name || 'Server';

    return (
        <aside className="channel-sidebar">
            <div className="channel-sidebar-header">
                <div>{serverName}</div>
                <ChevronDown size={18} />
            </div>
            
            <div className="channel-section" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="channel-category">TEXT CHANNELS</div>
                {channels.map(ch => (
                    <div 
                        key={ch.id} 
                        className={`channel-item ${channelId === ch.id ? 'active' : ''}`}
                        onClick={() => navigate(`/channels/${guildId}/${ch.id}`)}
                    >
                        <Hash size={20} color="var(--text-muted)"/>
                        {ch.name}
                    </div>
                ))}
                {channels.length === 0 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '8px 8px' }}>
                        No channels
                    </div>
                )}
            </div>

            {/* User Control Dock */}
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

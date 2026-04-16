import React from 'react';
import { Hash, ChevronDown } from 'lucide-react';
import './ChannelSidebar.css';

const ChannelSidebar: React.FC = () => {
    return (
        <aside className="channel-sidebar">
            <div className="channel-sidebar-header">
                <div>Spring Boot Server</div>
                <ChevronDown size={18} />
            </div>
            <div className="channel-section">
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
        </aside>
    );
};

export default ChannelSidebar;

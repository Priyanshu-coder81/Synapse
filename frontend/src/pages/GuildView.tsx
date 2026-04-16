import React from 'react';
import ChannelSidebar from '../components/guild/ChannelSidebar';
import ChatArea from '../components/chat/ChatArea';
import MembersList from '../components/guild/MembersList';

const GuildView: React.FC = () => {
    return (
        <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
            <ChannelSidebar />
            <ChatArea />
            <MembersList />
        </div>
    );
};

export default GuildView;

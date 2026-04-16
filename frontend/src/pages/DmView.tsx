import React from 'react';
import DmSidebar from '../components/dm/DmSidebar';
import ChatArea from '../components/chat/ChatArea';

const DmView: React.FC = () => {
    return (
        <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
            {/* Context Sidebar */}
            <DmSidebar />
            
            {/* The generalized WebSocket real-time component seamlessly catches the URL channelId! */}
            <ChatArea />
        </div>
    );
};

export default DmView;

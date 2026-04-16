import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChannelSidebar from '../components/guild/ChannelSidebar';
import ChatArea from '../components/chat/ChatArea';
import MembersList from '../components/guild/MembersList';
import { useServerStore } from '../store/useServerStore';

const GuildView: React.FC = () => {
    const { guildId, channelId } = useParams<{ guildId: string; channelId?: string }>();
    const navigate = useNavigate();
    const { currentServer, fetchServerDetails } = useServerStore();

    // Fetch server details on guildId change
    useEffect(() => {
        if (guildId) {
            fetchServerDetails(guildId);
        }
    }, [guildId]);

    // Auto-redirect to first channel if no channelId in URL
    useEffect(() => {
        if (guildId && !channelId && currentServer && currentServer.id === guildId && currentServer.channels.length > 0) {
            navigate(`/channels/${guildId}/${currentServer.channels[0].id}`, { replace: true });
        }
    }, [guildId, channelId, currentServer]);

    return (
        <div style={{ display: 'flex', width: '100%', height: '100dvh' }}>
            <ChannelSidebar />
            {channelId ? (
                <>
                    <ChatArea />
                    <MembersList />
                </>
            ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '16px' }}>
                    Select a channel to start chatting
                </div>
            )}
        </div>
    );
};

export default GuildView;

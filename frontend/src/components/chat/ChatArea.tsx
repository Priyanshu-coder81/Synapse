import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { PlusCircle, Search, Hash, Gift, Sticker, Smile } from 'lucide-react';
import { wsClient } from '../../api/websocketClient';
import { useAuthStore } from '../../store/useAuthStore';
import { useServerStore } from '../../store/useServerStore';
import axiosClient from '../../api/axiosClient';
import './ChatArea.css';

interface Message {
  id: string;
  senderUsername: string;
  content: string;
  createdAt: string;
  channelId?: string;
}

const ChatArea: React.FC = () => {
    const { channelId } = useParams<{ channelId: string }>();
    const [msg, setMsg] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    
    const { isAuthenticated } = useAuthStore();
    const { currentServer } = useServerStore();
    const token = localStorage.getItem('accessToken');
    const channelIdRef = useRef(channelId);

    // Keep ref in sync
    useEffect(() => {
        channelIdRef.current = channelId;
    }, [channelId]);

    // Resolve channel name from server store
    const channelName = currentServer?.channels.find(c => c.id === channelId)?.name || channelId || 'general';

    // Fetch history when channel changes
    useEffect(() => {
        if (!channelId) return;
        setMessages([]); // Clear messages on channel switch
        const fetchHistory = async () => {
             try {
                 const res = await axiosClient.get(`/channels/${channelId}/messages`);
                 if (Array.isArray(res.data)) {
                     setMessages(res.data);
                 }
             } catch(e) {}
        };
        fetchHistory();
    }, [channelId]);

    // WebSocket connection — connect once, manage subscriptions per channel
    useEffect(() => {
        if (!isAuthenticated || !token) return;

        wsClient.connect(token);

        return () => {
            // Only disconnect on full unmount (e.g., logout), not channel switch
        };
    }, [isAuthenticated, token]);

    // Subscribe to channel — separate effect so it reacts to channelId changes
    useEffect(() => {
        if (!channelId || !isAuthenticated || !token) return;

        const subscription = wsClient.subscribeToChannel(channelId, (newMsg: Message) => {
            if (newMsg.channelId === channelIdRef.current) {
                setMessages(prev => [newMsg, ...prev]);
            }
        });

        return () => {
            subscription?.unsubscribe();
            wsClient.leaveChannel(channelId);
        };
    }, [channelId, isAuthenticated, token]);

    const handleSendMessage = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && msg.trim() !== '') {
            if (channelId) {
                wsClient.sendMessage(channelId, msg.trim());
                setMsg(""); 
            }
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-topbar">
                <div className="chat-topbar-title">
                    <Hash size={24} color="var(--text-muted)" />
                    {channelName}
                </div>
                <div className="chat-search">
                     <input type="text" placeholder="Search" />
                     <Search size={16} color="var(--text-muted)" />
                </div>
            </div>
            
            <div className="chat-messages">
                 {messages.map((m) => (
                   <div key={m.id} className="message-wrapper">
                        <div className="message-avatar">{m.senderUsername.substring(0, 1).toUpperCase()}</div>
                        <div className="message-content">
                            <div className="message-header">
                                <span className="message-author">{m.senderUsername}</span>
                                <span className="message-timestamp">
                                   {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="message-body">{m.content}</div>
                        </div>
                   </div>
                 ))}
                 
                 {messages.length === 0 && channelId && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '8px' }}>
                        <Hash size={48} style={{ opacity: 0.3 }} />
                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-header)' }}>Welcome to #{channelName}!</div>
                        <div style={{ fontSize: '14px' }}>This is the start of the #{channelName} channel.</div>
                    </div>
                 )}
            </div>

            <div className="chat-input-wrapper">
                <div className="chat-input-box">
                    <PlusCircle className="chat-input-icon" size={24} />
                    <input 
                      type="text" 
                      placeholder={`Message #${channelName}`} 
                      value={msg}
                      onChange={e => setMsg(e.target.value)}
                      onKeyDown={handleSendMessage}
                    />
                    {/* Action Icons Toolbar */}
                    <div className="chat-input-actions">
                        <Gift size={22} className="action-icon" />
                        <Sticker size={22} className="action-icon" />
                        <Smile size={22} className="action-icon" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatArea;

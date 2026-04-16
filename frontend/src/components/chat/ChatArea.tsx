import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PlusCircle, Search, Hash, Gift, Sticker, Smile } from 'lucide-react';
import { wsClient } from '../../api/websocketClient';
import { useAuthStore } from '../../store/useAuthStore';
import './ChatArea.css';

interface Message {
  id: string;
  senderUsername: string;
  content: string;
  createdAt: string;
}

const ChatArea: React.FC = () => {
    const { channelId } = useParams<{ channelId: string }>();
    const [msg, setMsg] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    
    const { isAuthenticated } = useAuthStore();
    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        if (isAuthenticated && token) {
            wsClient.connect(token, () => {
               if (channelId) {
                   const subscription = wsClient.subscribeToChannel(channelId, (newMsg: Message) => {
                       setMessages(prev => [newMsg, ...prev]);
                   });
                   return () => subscription?.unsubscribe();
               }
            });
        }
        return () => wsClient.disconnect();
    }, [isAuthenticated, token, channelId]);

    const handleSendMessage = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && msg.trim() !== '') {
            if (channelId) {
                wsClient.sendMessage(channelId, msg.trim());
                setMsg(""); 
            } else {
                setMessages([{
                  id: Date.now().toString(),
                  senderUsername: 'You',
                  content: msg.trim(),
                  createdAt: new Date().toISOString()
                }, ...messages]);
                setMsg("");
            }
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-topbar">
                <div className="chat-topbar-title">
                    <Hash size={24} color="var(--text-muted)" />
                    {channelId ? `channel-${channelId}` : 'general'}
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
                 
                 <div className="message-wrapper">
                      <div className="message-avatar">W</div>
                      <div className="message-content">
                          <div className="message-header">
                              <span className="message-author">Wumpus</span>
                              <span className="message-timestamp">Today at 10:41 AM</span>
                          </div>
                          <div className="message-body">Welcome to the channel! Try checking the User Panel in the bottom left, or typing a message down below!</div>
                      </div>
                 </div>
            </div>

            <div className="chat-input-wrapper">
                <div className="chat-input-box">
                    <PlusCircle className="chat-input-icon" size={24} />
                    <input 
                      type="text" 
                      placeholder={channelId ? `Message #channel-${channelId}` : "Message #general"} 
                      value={msg}
                      onChange={e => setMsg(e.target.value)}
                      onKeyDown={handleSendMessage}
                    />
                    {/* Stage 6 Polish: Action Icons Toolbar */}
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

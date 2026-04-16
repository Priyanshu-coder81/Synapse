import React, { useState } from 'react';
import { PlusCircle, Search, Hash } from 'lucide-react';
import './ChatArea.css';

const ChatArea: React.FC = () => {
    const [msg, setMsg] = useState("");
    
    return (
        <div className="chat-container">
            {/* Contextual Topbar */}
            <div className="chat-topbar">
                <div className="chat-topbar-title">
                    <Hash size={24} color="var(--text-muted)" />
                    general
                </div>
                <div className="chat-search">
                     <input type="text" placeholder="Search" />
                     <Search size={16} color="var(--text-muted)" />
                </div>
            </div>
            
            {/* Interactive Messages Feed */}
            <div className="chat-messages">
                 {/* Reversing flex to stick input at bottom naturally - dummy msg top means bottom of div visually if flex-col-reverse */}
                 <div className="message-wrapper">
                      <div className="message-avatar">W</div>
                      <div className="message-content">
                          <div className="message-header">
                              <span className="message-author">Wumpus</span>
                              <span className="message-timestamp">Today at 10:41 AM</span>
                          </div>
                          <div className="message-body">Welcome to the #general channel! Let's get building with Spring Boot!</div>
                      </div>
                 </div>
            </div>

            {/* Always Pinned Message Input Array */}
            <div className="chat-input-wrapper">
                <div className="chat-input-box">
                    <PlusCircle className="chat-input-icon" size={24} />
                    <input 
                      type="text" 
                      placeholder="Message #general" 
                      value={msg}
                      onChange={e => setMsg(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatArea;

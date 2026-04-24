import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PlusCircle, Search, Hash, Gift, Sticker, Smile, Menu, Trash2, BarChart3 } from 'lucide-react';
import { wsClient } from '../../api/websocketClient';
import { useAuthStore } from '../../store/useAuthStore';
import { useServerStore } from '../../store/useServerStore';
import { useUIStore } from '../../store/useUIStore';
import axiosClient from '../../api/axiosClient';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import PollCard from './PollCard';
import './ChatArea.css';

const SAMPLE_GIFS = [
  "https://media.tenor.com/On7kvXhzO2l6AAAAC.gif",
  "https://media.tenor.com/L1M-Zk_c7pQAAAAM.gif",
  "https://media.tenor.com/w1-f_iZtP48AAAAM.gif",
  "https://media.tenor.com/gOvuT2jG_YAAAAAM.gif",
  "https://media.tenor.com/1-qI-m0iJCAAAAAM.gif",
  "https://media.tenor.com/5JzPqJ_J0uYAAAAM.gif"
];

interface Message {
  id: string;
  senderUsername: string;
  content: string;
  createdAt: string;
  channelId?: string;
}

interface Poll {
  id: string;
  channelId: string;
  creatorUsername: string;
  question: string;
  options: { id: string; text: string; votes: string[] }[];
  totalVotes: number;
  createdAt: string;
}

const ChatArea: React.FC = () => {
    const { channelId } = useParams<{ channelId: string }>();
    const [msg, setMsg] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [polls, setPolls] = useState<Poll[]>([]);
    
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [showPollHint, setShowPollHint] = useState(false);
    
    const { isAuthenticated } = useAuthStore();
    const { currentServer } = useServerStore();
    const { toggleMobileSidebar } = useUIStore();
    const token = localStorage.getItem('accessToken');
    const channelIdRef = useRef(channelId);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTypingRef = useRef(false);

    const currentUserId = useAuthStore.getState().userId || '';
    const currentUsername = useAuthStore.getState().username;

    useEffect(() => {
        channelIdRef.current = channelId;
    }, [channelId]);

    const channelName = currentServer?.channels.find(c => c.id === channelId)?.name || channelId || 'general';

    // Fetch messages + polls on channel change
    useEffect(() => {
        if (!channelId) return;
        setMessages([]);
        setPolls([]);
        setTypingUsers([]);

        const fetchHistory = async () => {
             try {
                 const res = await axiosClient.get(`/channels/${channelId}/messages`);
                 if (Array.isArray(res.data)) {
                     setMessages(res.data);
                 }
             } catch(e) {}
        };
        
        const fetchPolls = async () => {
            try {
                const res = await axiosClient.get(`/channels/${channelId}/polls`);
                if (Array.isArray(res.data)) {
                    setPolls(res.data);
                }
            } catch(e) {}
        };

        fetchHistory();
        fetchPolls();
    }, [channelId]);

    useEffect(() => {
        if (!isAuthenticated || !token) return;
        wsClient.connect(token);
        return () => {};
    }, [isAuthenticated, token]);

    useEffect(() => {
        if (!channelId || !isAuthenticated || !token) return;

        const subscription = wsClient.subscribeToChannel(channelId, (newMsg: Message) => {
            if (newMsg.channelId === channelIdRef.current) {
                setMessages(prev => {
                    if (prev.find(m => m.id === newMsg.id || m.content === newMsg.content && m.senderUsername === newMsg.senderUsername && Date.now() - new Date(m.createdAt).getTime() < 2000)) return prev;
                    return [newMsg, ...prev];
                });
            }
        });

        const cleanupTyping = wsClient.onUserTyping((data) => {
            if (data.channelId === channelIdRef.current) {
                setTypingUsers(prev => prev.includes(data.username) ? prev : [...prev, data.username]);
            }
        });

        const cleanupStopTyping = wsClient.onUserStopTyping((data) => {
            if (data.channelId === channelIdRef.current) {
                setTypingUsers(prev => prev.filter(u => u !== data.username));
            }
        });

        const cleanupDelete = wsClient.onMessageDeleted((data) => {
            if (data.channelId === channelIdRef.current) {
                setMessages(prev => prev.filter(m => m.id !== data.messageId));
            }
        });

        // Real-time poll updates
        const cleanupPoll = wsClient.onPollUpdated((updatedPoll: Poll) => {
            setPolls(prev => prev.map(p => p.id === updatedPoll.id ? updatedPoll : p));
        });

        return () => {
            subscription?.unsubscribe();
            wsClient.leaveChannel(channelId);
            cleanupTyping?.();
            cleanupStopTyping?.();
            cleanupDelete?.();
            cleanupPoll?.();
        };
    }, [channelId, isAuthenticated, token]);

    const handleTyping = useCallback(() => {
        if (!channelId) return;
        
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            wsClient.sendTypingStart(channelId);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            wsClient.sendTypingStop(channelId);
        }, 2000);
    }, [channelId]);

    // Parse /poll command: /poll "Question" "Opt1" "Opt2" "Opt3"
    const parsePollCommand = (text: string): { question: string; options: string[] } | null => {
        if (!text.startsWith('/poll ')) return null;
        const regex = /"([^"]+)"/g;
        const matches = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            matches.push(match[1]);
        }
        if (matches.length < 3) return null; // Need question + at least 2 options
        return { question: matches[0], options: matches.slice(1) };
    };

    const handleSendMessage = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && msg.trim() !== '') {
            if (channelId) {
                const text = msg.trim();
                
                // Check if it's a poll command
                const pollData = parsePollCommand(text);
                if (pollData) {
                    try {
                        const res = await axiosClient.post(`/channels/${channelId}/polls`, pollData);
                        setPolls(prev => [...prev, res.data]);
                        toast.success('Poll created!', { description: pollData.question });
                    } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Failed to create poll');
                    }
                    setMsg("");
                    return;
                }

                // Normal message
                wsClient.sendMessage(channelId, text);
                
                isTypingRef.current = false;
                wsClient.sendTypingStop(channelId);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                
                const optimisticMsg: Message = {
                    id: Date.now().toString(),
                    senderUsername: useAuthStore.getState().username || 'Unknown',
                    content: text,
                    createdAt: new Date().toISOString(),
                    channelId: channelId
                };
                setMessages(prev => [optimisticMsg, ...prev]);
                
                setMsg(""); 
            }
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!channelId) return;
        try {
            await axiosClient.delete(`/channels/${channelId}/messages/${messageId}`);
            setMessages(prev => prev.filter(m => m.id !== messageId));
            toast.info('Message deleted');
        } catch (e) {
            toast.error('Failed to delete message');
        }
    };

    const handlePollUpdate = (updatedPoll: Poll) => {
        setPolls(prev => prev.map(p => p.id === updatedPoll.id ? updatedPoll : p));
    };

    const handleSendGif = (url: string) => {
        if (channelId) {
            wsClient.sendMessage(channelId, url);
            const optimisticMsg: Message = {
                id: Date.now().toString(),
                senderUsername: useAuthStore.getState().username || 'Unknown',
                content: url,
                createdAt: new Date().toISOString(),
                channelId: channelId
            };
            setMessages(prev => {
                if (prev.find(m => m.id === optimisticMsg.id || m.content === url && m.senderUsername === optimisticMsg.senderUsername && Date.now() - new Date(m.createdAt).getTime() < 2000)) return prev;
                return [optimisticMsg, ...prev];
            });
        }
        setShowGifPicker(false);
    };

    const onEmojiClick = (emojiObject: any) => {
        setMsg(prev => prev + emojiObject.emoji);
    };

    const isGifUrl = (url: string) => url.startsWith('http') && url.includes('.gif');

    // Show poll hint when user starts typing /poll
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setMsg(val);
        setShowPollHint(val.startsWith('/poll'));
        handleTyping();
    };

    return (
        <div className="chat-container">
            <div className="chat-topbar">
                <div className="chat-topbar-title">
                    <Menu className="mobile-menu-btn" size={24} onClick={toggleMobileSidebar} />
                    <Hash size={24} className="text-[var(--text-muted)]" />
                    <span className="font-semibold">{channelName}</span>
                </div>
                <div className="chat-search">
                     <input type="text" placeholder="Search" />
                     <Search size={16} className="text-[var(--text-muted)]" />
                </div>
            </div>
            
            <div className="chat-messages">
                 {/* Poll Cards — rendered above messages */}
                 {polls.length > 0 && (
                    <div className="polls-section">
                        {polls.map(poll => (
                            <PollCard
                                key={poll.id}
                                poll={poll}
                                currentUserId={currentUserId}
                                onPollUpdate={handlePollUpdate}
                            />
                        ))}
                    </div>
                 )}

                 {messages.map((m) => (
                   <div key={m.id} className="message-wrapper group">
                        <Avatar className="h-10 w-10 bg-gradient-to-br from-[var(--brand)] to-[#7c6cf0] shrink-0">
                            <AvatarFallback className="bg-transparent text-white font-bold text-sm">
                                {m.senderUsername.substring(0, 1).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="message-content">
                            <div className="message-header">
                                <span className="message-author">{m.senderUsername}</span>
                                <span className="message-timestamp">
                                   {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {/* Delete button — only for own messages */}
                                {m.senderUsername === currentUsername && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button 
                                              className="message-delete-btn" 
                                              onClick={() => handleDeleteMessage(m.id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Delete Message</TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                            <div className="message-body">
                                {isGifUrl(m.content) ? (
                                    <img src={m.content} alt="gif" className="message-gif" />
                                ) : (
                                    m.content
                                )}
                            </div>
                        </div>
                   </div>
                 ))}
                 
                 {messages.length === 0 && polls.length === 0 && channelId && (
                    <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-2">
                        <Hash size={48} className="opacity-30" />
                        <div className="text-xl font-bold text-[var(--text-header)]">Welcome to #{channelName}!</div>
                        <div className="text-sm">This is the start of the #{channelName} channel.</div>
                        <div className="text-xs mt-2 opacity-60">
                            💡 Try: <code className="bg-white/5 px-2 py-1 rounded text-[var(--brand)]">/poll "Question?" "Option 1" "Option 2"</code>
                        </div>
                    </div>
                 )}
            </div>

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
                <div className="typing-indicator">
                    <div className="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                    <span className="typing-text">
                        {typingUsers.length === 1 
                            ? `${typingUsers[0]} is typing...` 
                            : typingUsers.length === 2 
                                ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                                : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`
                        }
                    </span>
                </div>
            )}

            {/* Poll command hint */}
            {showPollHint && (
                <div className="poll-command-hint">
                    <BarChart3 size={16} className="text-[var(--brand)]" />
                    <div>
                        <div className="font-semibold text-white text-sm">Create a Poll</div>
                        <div className="text-xs text-[var(--text-muted)]">
                            Format: <code>/poll "Your question?" "Option 1" "Option 2" "Option 3"</code>
                        </div>
                    </div>
                </div>
            )}

            <div className="chat-input-wrapper">
                <div className="chat-input-box">
                    <PlusCircle className="chat-input-icon" size={24} />
                    <input 
                      type="text" 
                      placeholder={`Message #${channelName}`} 
                      value={msg}
                      onChange={handleInputChange}
                      onKeyDown={handleSendMessage}
                    />
                    <div className="chat-input-actions">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Gift 
                                    size={22} 
                                    className="action-icon" 
                                    onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }} 
                                />
                            </TooltipTrigger>
                            <TooltipContent side="top">Send GIF</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Sticker size={22} className="action-icon" />
                            </TooltipTrigger>
                            <TooltipContent side="top">Stickers</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Smile 
                                    size={22} 
                                    className="action-icon" 
                                    onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }} 
                                />
                            </TooltipTrigger>
                            <TooltipContent side="top">Emoji</TooltipContent>
                        </Tooltip>
                    </div>
                </div>
                
                {(showEmojiPicker || showGifPicker) && (
                    <div className="chat-pickers-container">
                        {showGifPicker && (
                            <div className="gif-picker">
                                <div className="gif-picker-header">Trending GIFs</div>
                                <div className="gif-grid">
                                    {SAMPLE_GIFS.map((gif, idx) => (
                                        <img 
                                            key={idx} 
                                            src={gif} 
                                            alt="gif" 
                                            className="gif-item" 
                                            onClick={() => handleSendGif(gif)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        {showEmojiPicker && (
                            <EmojiPicker 
                                onEmojiClick={onEmojiClick}
                                theme={Theme.DARK}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatArea;

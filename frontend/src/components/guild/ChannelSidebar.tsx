import React, { useEffect } from 'react';
import { Hash, ChevronDown, Settings, LogOut, Bell, UserPlus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useServerStore } from '../../store/useServerStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import './ChannelSidebar.css';

const ChannelSidebar: React.FC = () => {
    const { username } = useAuthStore();
    const navigate = useNavigate();
    const { guildId, channelId } = useParams<{ guildId: string; channelId?: string }>();
    const { currentServer, fetchServerDetails, leaveServer, fetchMyServers } = useServerStore();

    useEffect(() => {
        if (guildId) {
            fetchServerDetails(guildId);
        }
    }, [guildId]);
    
    const channels = currentServer?.channels || [];
    const serverName = currentServer?.name || 'Server';

    const handleLeaveServer = async () => {
        if (!guildId) return;
        
        try {
            await leaveServer(guildId);
            await fetchMyServers();
            toast.success(`Left "${serverName}"`, { description: 'You have left the server.' });
            navigate('/channels/@me');
        } catch (e) {
            toast.error('Failed to leave server');
        }
    };

    return (
        <aside className="channel-sidebar">
            <DropdownMenu>
                <DropdownMenuTrigger className="channel-sidebar-header w-full">
                    <div className="truncate font-semibold">{serverName}</div>
                    <ChevronDown size={18} className="shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mx-2">
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                        <UserPlus size={16} />
                        Invite People
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                        <Bell size={16} />
                        Notification Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                        onClick={handleLeaveServer}
                    >
                        <LogOut size={16} />
                        Leave Server
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
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
                 <Avatar className="h-8 w-8 bg-gradient-to-br from-[var(--brand)] to-[#7c6cf0]">
                     <AvatarFallback className="bg-transparent text-white font-bold text-sm">
                         {username ? username.charAt(0).toUpperCase() : 'U'}
                     </AvatarFallback>
                 </Avatar>
                 <div className="user-profile-info">
                     <div className="user-name">{username || 'User'}</div>
                     <div className="user-tag">Online</div>
                 </div>
                 <div className="user-profile-controls">
                     <Tooltip>
                         <TooltipTrigger asChild>
                             <Settings size={20} className="control-icon" onClick={() => navigate('/settings')} />
                         </TooltipTrigger>
                         <TooltipContent side="top">User Settings</TooltipContent>
                     </Tooltip>
                 </div>
            </div>
        </aside>
    );
};

export default ChannelSidebar;

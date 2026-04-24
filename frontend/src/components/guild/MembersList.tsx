import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { wsClient } from '../../api/websocketClient';
import axiosClient from '../../api/axiosClient';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import './MembersList.css';

interface Member {
  id: string;
  username: string;
  isOnline?: boolean;
}

const MembersList: React.FC = () => {
    const { guildId } = useParams<{ guildId: string }>();
    const [members, setMembers] = useState<Member[]>([]);

    useEffect(() => {
        if (!guildId) return;
        const fetchMembers = async () => {
            try {
                const res = await axiosClient.get(`/servers/${guildId}/members`);
                setMembers(res.data);
            } catch (e) {
                console.error('Failed to fetch members:', e);
            }
        };
        fetchMembers();
    }, [guildId]);

    // Listen for real-time presence changes
    useEffect(() => {
        const cleanup = wsClient.onPresenceUpdate((data) => {
            setMembers(prev => prev.map(m => 
                m.username === data.username 
                    ? { ...m, isOnline: data.status === 'online' } 
                    : m
            ));
        });
        return cleanup;
    }, []);

    const onlineMembers = members.filter(m => m.isOnline);
    const offlineMembers = members.filter(m => !m.isOnline);

    return (
        <aside className="members-sidebar">
            <ScrollArea className="h-full">
                <div className="p-2">
                    {/* Online section */}
                    {onlineMembers.length > 0 && (
                        <>
                            <div className="members-category">ONLINE — {onlineMembers.length}</div>
                            {onlineMembers.map(member => (
                                <div key={member.id} className="member-item group">
                                    <div className="relative">
                                        <Avatar className="h-8 w-8 bg-gradient-to-br from-[var(--brand)] to-[#7c6cf0]">
                                            <AvatarFallback className="bg-transparent text-white font-bold text-xs">
                                                {member.username.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--green)] border-2 border-[var(--bg-tertiary)] rounded-full shadow-[0_0_6px_rgba(35,165,89,0.5)]" />
                                    </div>
                                    <div className="member-name group-hover:text-white transition-colors">{member.username}</div>
                                </div>
                            ))}
                        </>
                    )}

                    {onlineMembers.length > 0 && offlineMembers.length > 0 && (
                        <Separator className="my-2 opacity-10" />
                    )}

                    {/* Offline section */}
                    {offlineMembers.length > 0 && (
                        <>
                            <div className="members-category">OFFLINE — {offlineMembers.length}</div>
                            {offlineMembers.map(member => (
                                <div key={member.id} className="member-item opacity-50 group">
                                    <div className="relative">
                                        <Avatar className="h-8 w-8 bg-[var(--bg-quaternary)]">
                                            <AvatarFallback className="bg-transparent text-[var(--text-muted)] font-bold text-xs">
                                                {member.username.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--text-muted)] border-2 border-[var(--bg-tertiary)] rounded-full" />
                                    </div>
                                    <div className="member-name">{member.username}</div>
                                </div>
                            ))}
                        </>
                    )}
                    
                    {members.length === 0 && (
                        <div className="text-[var(--text-muted)] text-sm p-4 text-center">
                            No members yet
                        </div>
                    )}
                </div>
            </ScrollArea>
        </aside>
    );
};

export default MembersList;

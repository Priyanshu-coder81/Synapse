import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import './MembersList.css';

interface Member {
  id: string;
  username: string;
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

    return (
        <aside className="members-sidebar">
            <div className="members-category">MEMBERS — {members.length}</div>
            {members.map(member => (
                <div key={member.id} className="member-item">
                     <div className="member-avatar">
                         {member.username.charAt(0).toUpperCase()}
                         <div className="member-status online" />
                     </div>
                     <div className="member-name">{member.username}</div>
                </div>
            ))}
            {members.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '8px 16px' }}>
                    No members yet
                </div>
            )}
        </aside>
    );
};

export default MembersList;

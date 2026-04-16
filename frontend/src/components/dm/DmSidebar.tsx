import React, { useEffect, useState } from 'react';
import { Users, Plus, Mic, Headphones, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import './DmSidebar.css';

interface Friend {
  id: string; // The request ID
  userId: string; // The actual target's ID
  username: string;
  status: string;
}

const DmSidebar: React.FC = () => {
  const { username, logout, userId } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
     const fetchFriends = async () => {
       try {
         const res = await axiosClient.get('/friends');
         setFriends(res.data.filter((f: Friend) => f.status === 'ACCEPTED'));
       } catch (e) {}
     };
     fetchFriends();
     // Polling loop (reduced frequency)
     const int = setInterval(fetchFriends, 15000);
     return () => clearInterval(int);
  }, []);

  // Guarantee symmetrical channel keys regardless of who initiated the DM!
  const getSharedDmId = (otherId: string) => {
     const p1 = userId || '';
     const p2 = otherId || '';
     return p1 > p2 ? `${p1}_${p2}` : `${p2}_${p1}`;
  };

  return (
    <aside className="dm-sidebar">
      <div className="dm-sidebar-header">
        <div className="dm-search-bar">Find or start a conversation</div>
      </div>

      <div className="dm-nav-list">
        <div className={`dm-nav-item ${location.pathname === '/channels/@me' ? 'active' : ''}`} onClick={() => navigate('/channels/@me')}>
          <Users size={20} />
          <span>Friends</span>
        </div>
      </div>

      <div className="dm-header-text">
        <span>DIRECT MESSAGES</span>
        <Plus size={16} style={{ cursor: 'pointer' }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', marginTop: '8px' }}>
        {friends.map(friend => {
          const sharedDmId = getSharedDmId(friend.userId);
          const isActive = location.pathname === `/channels/@me/${sharedDmId}`;
          
          return (
            <div 
               key={friend.id} 
               className={`dm-user-item ${isActive ? 'active' : ''}`}
               onClick={() => navigate(`/channels/@me/${sharedDmId}`)}
            >
              <div className="dm-avatar">
                <div className="dm-status online"></div>
              </div>
              <div className="dm-user-name">{friend.username}</div>
            </div>
          );
        })}
      </div>
      
      {/* Dynamic Authorized User Dock matching ChannelSidebar */}
      <div className="user-profile-panel">
         <div className="user-profile-avatar">
             {username ? username.charAt(0).toUpperCase() : 'U'}
             <div className="user-profile-status" />
         </div>
         <div className="user-profile-info">
             <div className="user-name">{username || 'User'}</div>
             <div className="user-tag">Online</div>
         </div>
         <div className="user-profile-controls">
             <Mic size={20} className="control-icon" />
             <Headphones size={20} className="control-icon" />
             <Settings size={20} className="control-icon" onClick={() => navigate('/settings')} title="User Settings" />
         </div>
      </div>
    </aside>
  );
};

export default DmSidebar;

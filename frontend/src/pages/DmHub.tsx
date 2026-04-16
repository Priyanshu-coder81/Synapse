import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import DmSidebar from '../components/dm/DmSidebar';
import axiosClient from '../api/axiosClient';
import './DmHub.css';

interface Friend {
  id: string;
  username: string;
  status: string;
  isIncoming: boolean;
}

const DmHub: React.FC = () => {
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [friendName, setFriendName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchFriends = async () => {
    try {
      const res = await axiosClient.get('/friends');
      setFriendsList(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // Poll the status or just fetch once
    fetchFriends();
    const interval = setInterval(fetchFriends, 2000); // Hacky mock auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleAddFriend = async () => {
    try {
      setErrorMsg('');
      await axiosClient.post('/friends', { targetUsername: friendName.trim() });
      setFriendName('');
      fetchFriends();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error adding friend');
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await axiosClient.post('/friends/accept', { requestId });
      fetchFriends();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dm-hub-container">
      <DmSidebar />

      <div className="dm-main-area">
        <div className="dm-topbar">
          <div className="dm-topbar-title">
            <Users size={24} color="var(--text-muted)" />
            Friends
          </div>
          <div className="topbar-separator"></div>
          <div className="dm-topbar-nav">
            <span className="add-friend">Add Friend Panel</span>
          </div>
        </div>

        <div className="dm-content" style={{ padding: '32px' }}>
             <h2 style={{ color: 'var(--text-header)', marginBottom: '8px' }}>ADD FRIEND</h2>
             <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                 You can add a friend with their registered username.
             </p>
             <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                 <input 
                    type="text" 
                    value={friendName} 
                    onChange={e => setFriendName(e.target.value)} 
                    placeholder="Enter a Username (e.g., icebear)" 
                    style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #111214', backgroundColor: 'var(--bg-tertiary)', color: 'white', fontSize: '16px' }}
                 />
                 <button onClick={handleAddFriend} className="btn-primary" style={{ padding: '0 24px', width: 'auto' }}>Send Friend Request</button>
             </div>
             
             {errorMsg && <div style={{ color: 'var(--button-danger)', fontSize: '14px', marginBottom: '32px', fontWeight: 'bold' }}>{errorMsg}</div>}
             {!errorMsg && <div style={{ marginBottom: '32px' }} />}

             <h2 style={{ color: 'var(--text-header)', marginBottom: '16px', borderBottom: '1px solid var(--bg-tertiary)', paddingBottom: '8px' }}>Friends List — {friendsList.length}</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 {friendsList.length === 0 && (
                     <div style={{ color: 'var(--text-muted)' }}>You don't have any friends or pending requests yet.</div>
                 )}
                 {friendsList.map(f => (
                     <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', opacity: f.status === 'PENDING' ? 0.8 : 1 }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                             <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                 {f.username.charAt(0).toUpperCase()}
                             </div>
                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                                 <div style={{ color: 'var(--text-normal)', fontWeight: 600, fontSize: '16px' }}>{f.username}</div>
                                 <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold' }}>
                                    {f.status === 'PENDING' ? (f.isIncoming ? "Incoming Request" : "Outgoing Request") : "Accepted Friend"}
                                 </div>
                             </div>
                         </div>
                         {f.status === 'PENDING' && f.isIncoming && (
                             <button onClick={() => handleAccept(f.id)} className="btn-primary" style={{ padding: '8px 16px', width: 'auto', backgroundColor: '#23a559' }}>Accept Request</button>
                         )}
                     </div>
                 ))}
             </div>
        </div>
      </div>
    </div>
  );
};

export default DmHub;

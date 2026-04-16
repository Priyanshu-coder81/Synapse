import React from 'react';
import { Users, Smile, Plus } from 'lucide-react';
import './DmSidebar.css';

const DmSidebar: React.FC = () => {
  const friends = [
    { id: '1', name: 'Wumpus', status: 'online' },
    { id: '2', name: 'Yatha', status: 'dnd' },
    { id: '3', name: 'Java Master ☕', status: 'idle' }
  ];

  return (
    <aside className="dm-sidebar">
      {/* Search Header */}
      <div className="dm-sidebar-header">
        <div className="dm-search-bar">Find or start a conversation</div>
      </div>

      {/* Main Nav Items */}
      <div className="dm-nav-list">
        <div className="dm-nav-item active">
          <Users size={20} />
          <span>Friends</span>
        </div>
        <div className="dm-nav-item">
          <Smile size={20} />
          <span>Nitro</span>
        </div>
      </div>

      {/* Direct Messages List */}
      <div className="dm-header-text">
        <span>DIRECT MESSAGES</span>
        <Plus size={16} style={{ cursor: 'pointer' }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', marginTop: '8px' }}>
        {friends.map(friend => (
          <div key={friend.id} className="dm-user-item">
            <div className="dm-avatar">
              <div className={`dm-status ${friend.status}`}></div>
            </div>
            <div className="dm-user-name">{friend.name}</div>
          </div>
        ))}
      </div>
      
      {/* User settings bar placeholder for the future */}
      <div style={{ height: '52px', backgroundColor: '#232428', flexShrink: 0, padding: '0 8px', display: 'flex', alignItems: 'center' }}>
        <div className="dm-avatar" style={{width: '32px', height: '32px'}}>
            <div className="dm-status online" style={{ borderColor: '#232428' }}></div>
        </div>
        <div style={{marginLeft: '8px', flex: 1}}>
           <div style={{fontSize: '14px', fontWeight: 'bold', color: 'var(--text-header)'}}>You</div>
           <div style={{fontSize: '11px', color: 'var(--text-muted)'}}>Online</div>
        </div>
      </div>
    </aside>
  );
};

export default DmSidebar;

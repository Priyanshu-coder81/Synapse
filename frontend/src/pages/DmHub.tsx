import React from 'react';
import { Users } from 'lucide-react';
import DmSidebar from '../components/dm/DmSidebar';
import './DmHub.css';

const DmHub: React.FC = () => {
  return (
    <div className="dm-hub-container">
      {/* Left hand secondary sidebar specifically for DMs */}
      <DmSidebar />

      {/* Main Friends List Pane */}
      <div className="dm-main-area">
        {/* Top Navigation Bar */}
        <div className="dm-topbar">
          <div className="dm-topbar-title">
            <Users size={24} color="var(--text-muted)" />
            Friends
          </div>
          
          <div className="topbar-separator"></div>
          
          <div className="dm-topbar-nav">
            <span className="active">Online</span>
            <span>All</span>
            <span>Pending</span>
            <span>Blocked</span>
            <span className="add-friend">Add Friend</span>
          </div>
        </div>

        {/* Empty State View */}
        <div className="dm-content">
          <div className="empty-state-img">
            No one's around to play with Wumpus.
          </div>
          <p>Wumpus is waiting on friends. You don't have to though!</p>
        </div>
      </div>
    </div>
  );
};

export default DmHub;

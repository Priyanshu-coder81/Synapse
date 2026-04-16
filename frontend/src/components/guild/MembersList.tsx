import React from 'react';
import './MembersList.css';

const MembersList: React.FC = () => {
    return (
        <aside className="members-sidebar">
            <div className="members-category">ONLINE — 1</div>
            <div className="member-item">
                 <div className="member-avatar">
                     A
                     <div className="member-status online" />
                 </div>
                 <div className="member-name">Admin</div>
            </div>
            
            <div className="members-category" style={{ marginTop: '16px' }}>OFFLINE — 2</div>
            <div className="member-item offline">
                 <div className="member-avatar">Y</div>
                 <div className="member-name">Yatha</div>
            </div>
            <div className="member-item offline">
                 <div className="member-avatar">J</div>
                 <div className="member-name">Java Master</div>
            </div>
        </aside>
    );
};

export default MembersList;

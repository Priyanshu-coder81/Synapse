import React, { useEffect } from 'react';
import { useServerStore } from '../../store/useServerStore';
import { X, LogIn, Check } from 'lucide-react';
import './JoinServerModal.css';

interface Props {
  onClose: () => void;
}

const JoinServerModal: React.FC<Props> = ({ onClose }) => {
  const { discoverServers, fetchDiscoverServers, joinServer } = useServerStore();

  useEffect(() => {
    fetchDiscoverServers();
  }, []);

  const handleJoin = async (serverId: string) => {
    await joinServer(serverId);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Join a Server</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <p className="modal-subtitle">Browse and join available servers to start chatting!</p>
        
        <div className="modal-server-list">
          {discoverServers.map(server => (
            <div key={server.id} className="modal-server-card">
              <div className="modal-server-icon">{server.icon}</div>
              <div className="modal-server-info">
                <div className="modal-server-name">{server.name}</div>
                <div className="modal-server-meta">
                  {server.memberCount} member{server.memberCount !== 1 ? 's' : ''} · {server.channelCount} channel{server.channelCount !== 1 ? 's' : ''}
                </div>
              </div>
              {server.isJoined ? (
                <div className="modal-joined-badge"><Check size={16} /> Joined</div>
              ) : (
                <button className="modal-join-btn" onClick={() => handleJoin(server.id)}>
                  <LogIn size={16} /> Join
                </button>
              )}
            </div>
          ))}

          {discoverServers.length === 0 && (
            <div className="modal-empty">No servers available to discover.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinServerModal;

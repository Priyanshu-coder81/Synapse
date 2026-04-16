import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServerStore } from '../store/useServerStore';
import { Compass, ArrowLeft, LogIn, Check, Users, Hash } from 'lucide-react';
import './ExplorePage.css';

const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const { discoverServers, fetchDiscoverServers, joinServer } = useServerStore();

  useEffect(() => {
    fetchDiscoverServers();
  }, []);

  const handleJoin = async (serverId: string) => {
    await joinServer(serverId);
  };

  return (
    <div className="explore-page">
      <div className="explore-topbar">
        <button className="explore-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <Compass size={24} color="var(--green)" />
        <span className="explore-title">Explore Servers</span>
      </div>

      <div className="explore-content">
        <div className="explore-hero">
          <h1>Find your community</h1>
          <p>From gaming to education to just having fun, there's something for everyone.</p>
        </div>

        <div className="explore-grid">
          {discoverServers.map(server => (
            <div key={server.id} className="explore-card">
              <div className="explore-card-banner">
                <div className="explore-card-icon">{server.icon}</div>
              </div>
              <div className="explore-card-body">
                <h3 className="explore-card-name">{server.name}</h3>
                <div className="explore-card-stats">
                  <span><Users size={14} /> {server.memberCount} member{server.memberCount !== 1 ? 's' : ''}</span>
                  <span><Hash size={14} /> {server.channelCount} channel{server.channelCount !== 1 ? 's' : ''}</span>
                </div>
                {server.isJoined ? (
                  <div className="explore-card-joined"><Check size={16} /> Already Joined</div>
                ) : (
                  <button className="explore-card-join" onClick={() => handleJoin(server.id)}>
                    <LogIn size={16} /> Join Server
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {discoverServers.length === 0 && (
          <div className="explore-empty">
            <Compass size={48} color="var(--text-muted)" />
            <p>No servers to discover right now.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;

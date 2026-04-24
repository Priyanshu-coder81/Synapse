import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServerStore } from '../store/useServerStore';
import { Compass, ArrowLeft, LogIn, Check, Users, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import './ExplorePage.css';

const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const { discoverServers, fetchDiscoverServers, joinServer } = useServerStore();

  useEffect(() => {
    fetchDiscoverServers();
  }, []);

  const handleJoin = async (server: typeof discoverServers[0]) => {
    await joinServer(server.id);
    toast.success(`Joined "${server.name}"!`);
  };

  return (
    <div className="explore-page">
      <div className="explore-topbar">
        <Button variant="ghost" size="icon" className="text-[var(--text-normal)]" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <Compass size={24} className="text-[var(--green)]" />
        <span className="explore-title font-semibold">Explore Servers</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="explore-content">
          <div className="explore-hero">
            <h1>Find your community</h1>
            <p>From gaming to education to just having fun, there's something for everyone.</p>
          </div>

          <div className="explore-grid">
            {discoverServers.map(server => (
              <div key={server.id} className="explore-card group">
                <div className="explore-card-banner">
                  <Avatar className="h-12 w-12 bg-white/20 backdrop-blur-sm shadow-lg">
                    <AvatarFallback className="bg-transparent text-white font-bold text-lg">
                      {server.icon}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="explore-card-body">
                  <h3 className="explore-card-name">{server.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mb-3">
                    <span className="flex items-center gap-1"><Users size={14} /> {server.memberCount} member{server.memberCount !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1"><Hash size={14} /> {server.channelCount} channel{server.channelCount !== 1 ? 's' : ''}</span>
                  </div>
                  {server.isJoined ? (
                    <Badge variant="outline" className="w-full justify-center py-2 text-[var(--green)] border-[var(--green)]/30 bg-[var(--green)]/10 gap-1">
                      <Check size={14} /> Already Joined
                    </Badge>
                  ) : (
                    <Button 
                      className="w-full gap-1 bg-gradient-to-r from-[var(--brand)] to-[#7c6cf0] text-white hover:shadow-[0_0_20px_rgba(88,101,242,0.3)]" 
                      onClick={() => handleJoin(server)}
                    >
                      <LogIn size={14} /> Join Server
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {discoverServers.length === 0 && (
            <div className="explore-empty">
              <Compass size={48} className="text-[var(--text-muted)]" />
              <p>No servers to discover right now.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ExplorePage;

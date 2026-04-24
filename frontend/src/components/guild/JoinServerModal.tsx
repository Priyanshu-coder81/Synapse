import React, { useEffect } from 'react';
import { useServerStore } from '../../store/useServerStore';
import { LogIn, Check, Users, Hash } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
}

const JoinServerModal: React.FC<Props> = ({ onClose }) => {
  const { discoverServers, fetchDiscoverServers, joinServer } = useServerStore();

  useEffect(() => {
    fetchDiscoverServers();
  }, []);

  const handleJoin = async (server: typeof discoverServers[0]) => {
    await joinServer(server.id);
    toast.success(`Joined "${server.name}"!`);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[480px] bg-[var(--bg-modal)] border-white/5 p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl text-center">Join a Server</DialogTitle>
          <DialogDescription className="text-center text-[var(--text-muted)]">
            Browse and join available servers to start chatting!
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] px-4 pb-4">
          <div className="space-y-2 p-2">
            {discoverServers.map(server => (
              <div
                key={server.id} 
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors duration-200 group"
              >
                <Avatar className="h-10 w-10 bg-gradient-to-br from-[var(--brand)] to-[#7c6cf0] shrink-0">
                  <AvatarFallback className="bg-transparent text-white font-bold">
                    {server.icon}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{server.name}</div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1"><Users size={12} /> {server.memberCount}</span>
                    <span className="flex items-center gap-1"><Hash size={12} /> {server.channelCount}</span>
                  </div>
                </div>
                {server.isJoined ? (
                  <Badge variant="outline" className="text-[var(--green)] border-[var(--green)]/30 bg-[var(--green)]/10 gap-1 shrink-0">
                    <Check size={12} /> Joined
                  </Badge>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => handleJoin(server)}
                    className="bg-gradient-to-r from-[var(--brand)] to-[#7c6cf0] text-white gap-1 shrink-0 hover:shadow-[0_0_16px_rgba(88,101,242,0.3)]"
                  >
                    <LogIn size={14} /> Join
                  </Button>
                )}
              </div>
            ))}

            {discoverServers.length === 0 && (
              <div className="text-center text-[var(--text-muted)] py-8 text-sm">
                No servers available to discover.
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator className="opacity-10" />
        
        <div className="p-4 text-center text-xs text-[var(--text-muted)]">
          Or ask a friend for an invite link!
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinServerModal;

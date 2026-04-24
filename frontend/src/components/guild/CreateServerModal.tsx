import React, { useState } from 'react';
import { Plus, Hash, Loader } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axiosClient from '../../api/axiosClient';
import { useServerStore } from '../../store/useServerStore';
import { toast } from 'sonner';

interface CreateServerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateServerModal: React.FC<CreateServerModalProps> = ({ isOpen, onClose }) => {
    const [serverName, setServerName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { fetchMyServers } = useServerStore();

    const handleCreate = async () => {
        if (!serverName.trim()) {
            setError('Server name is required');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            await axiosClient.post('/servers', { name: serverName.trim() });
            await fetchMyServers();
            toast.success(`Server "${serverName.trim()}" created!`, {
                description: 'Your new server is ready with #general and #chat channels.'
            });
            setServerName('');
            onClose();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to create server');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) handleCreate();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-[440px] bg-[var(--bg-modal)] border-white/5 p-0 gap-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl text-center">Create Your Server</DialogTitle>
                    <DialogDescription className="text-center text-[var(--text-muted)]">
                        Give your server a personality with a name. You can always change it later.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-5">
                    {/* Server preview */}
                    <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--brand)] via-[#7c6cf0] to-[#a78bfa] flex items-center justify-center text-white text-4xl font-extrabold border-3 border-dashed border-white/15 transition-all duration-300 animate-in zoom-in-90">
                            {serverName.trim() ? serverName.trim().charAt(0).toUpperCase() : <Plus size={32} />}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#b9bbbe]">
                            Server Name
                        </label>
                        <Input 
                            placeholder="My Awesome Server"
                            value={serverName}
                            onChange={e => { setServerName(e.target.value); setError(''); }}
                            onKeyDown={handleKeyDown}
                            maxLength={50}
                            autoFocus
                            className="bg-[var(--input-bg)] border-white/5 text-white h-11 text-base placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--brand)]"
                        />
                        <div className="text-xs text-right text-[var(--text-muted)]">
                            {serverName.length}/50
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <Hash size={14} />
                        <span>Your server will start with <Badge variant="secondary" className="text-xs">#general</Badge> and <Badge variant="secondary" className="text-xs">#chat</Badge> channels.</span>
                    </div>
                </div>

                <DialogFooter className="bg-black/15 p-4 flex gap-2">
                    <Button variant="ghost" onClick={onClose} className="text-[var(--text-normal)]">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleCreate}
                        disabled={loading || !serverName.trim()}
                        className="bg-gradient-to-r from-[var(--brand)] to-[#7c6cf0] hover:shadow-[0_0_20px_rgba(88,101,242,0.3)] text-white"
                    >
                        {loading ? <Loader size={18} className="animate-spin" /> : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateServerModal;

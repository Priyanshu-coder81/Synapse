import React, { useState } from 'react';
import { BarChart3, Check, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import axiosClient from '../../api/axiosClient';
import './PollCard.css';

interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

interface Poll {
  id: string;
  channelId: string;
  creatorUsername: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  createdAt: string;
}

interface PollCardProps {
  poll: Poll;
  currentUserId: string;
  onPollUpdate: (poll: Poll) => void;
}

const OPTION_COLORS = [
  '#5865f2', // blurple
  '#7c6cf0', // purple
  '#eb459e', // fuchsia
  '#57f287', // green
  '#fee75c', // yellow
  '#ed4245', // red
  '#3ba55c', // dark green
  '#f47b67', // salmon
];

const PollCard: React.FC<PollCardProps> = ({ poll, currentUserId, onPollUpdate }) => {
    const [voting, setVoting] = useState(false);
    
    // Which option did the current user vote for?
    const userVotedOptionId = poll.options.find(o => o.votes.includes(currentUserId))?.id || null;
    const hasVoted = userVotedOptionId !== null;

    const handleVote = async (optionId: string) => {
        if (voting) return;
        setVoting(true);
        try {
            const res = await axiosClient.post(`/polls/${poll.id}/vote`, { optionId });
            onPollUpdate(res.data);
        } catch (e) {
            console.error('Vote failed:', e);
        } finally {
            setVoting(false);
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="poll-card">
            {/* Poll Header */}
            <div className="poll-header">
                <div className="poll-header-left">
                    <BarChart3 size={18} className="text-[var(--brand)]" />
                    <span className="poll-label">POLL</span>
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="poll-meta">
                            <Clock size={12} />
                            <span>{timeAgo(poll.createdAt)}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>{new Date(poll.createdAt).toLocaleString()}</TooltipContent>
                </Tooltip>
            </div>

            {/* Question */}
            <div className="poll-question">{poll.question}</div>

            {/* Creator */}
            <div className="poll-creator">
                <Avatar className="h-5 w-5 bg-gradient-to-br from-[var(--brand)] to-[#7c6cf0]">
                    <AvatarFallback className="bg-transparent text-white text-[10px] font-bold">
                        {poll.creatorUsername.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <span>Asked by <strong>{poll.creatorUsername}</strong></span>
            </div>

            {/* Options */}
            <div className="poll-options">
                {poll.options.map((option, idx) => {
                    const percentage = poll.totalVotes > 0 
                        ? Math.round((option.votes.length / poll.totalVotes) * 100) 
                        : 0;
                    const isSelected = option.id === userVotedOptionId;
                    const color = OPTION_COLORS[idx % OPTION_COLORS.length];
                    
                    return (
                        <button
                            key={option.id}
                            className={`poll-option ${isSelected ? 'selected' : ''} ${hasVoted ? 'voted' : ''}`}
                            onClick={() => handleVote(option.id)}
                            disabled={voting}
                        >
                            {/* Progress bar background */}
                            <div 
                                className="poll-option-fill"
                                style={{ 
                                    width: hasVoted ? `${percentage}%` : '0%',
                                    backgroundColor: `${color}22`,
                                    borderLeft: hasVoted && percentage > 0 ? `3px solid ${color}` : 'none'
                                }}
                            />
                            
                            <div className="poll-option-content">
                                <div className="poll-option-left">
                                    <div 
                                        className={`poll-option-radio ${isSelected ? 'selected' : ''}`}
                                        style={{ borderColor: isSelected ? color : undefined }}
                                    >
                                        {isSelected && <Check size={10} className="text-white" />}
                                    </div>
                                    <span className="poll-option-text">{option.text}</span>
                                </div>
                                
                                {hasVoted && (
                                    <div className="poll-option-right">
                                        <span className="poll-option-count">{option.votes.length}</span>
                                        <span className="poll-option-percent" style={{ color }}>{percentage}%</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="poll-footer">
                <div className="poll-total-votes">
                    <Users size={14} />
                    <span>{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</span>
                </div>
                {hasVoted && (
                    <Badge variant="outline" className="text-[10px] text-[var(--brand)] border-[var(--brand)]/30 bg-[var(--brand)]/10">
                        You voted
                    </Badge>
                )}
            </div>
        </div>
    );
};

export default PollCard;

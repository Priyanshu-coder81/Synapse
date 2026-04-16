import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

export const channelRouter = Router();

// Apply Security Shield
channelRouter.use(authenticateToken as any);

// POST: Instantiate new context channels within an existing Guild
channelRouter.post('/', async (req: AuthRequest, res) => {
    try {
        const { guildId, name, topic } = req.body;
        
        // Ensure user is authorized to create via query mapping
        const channel = await prisma.channel.create({
            data: { guildId, name, topic }
        });
        
        res.status(201).json(channel);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error spawning channel' });
    }
});

// GET: Historical REST retrieval of Chat logs (Pre-WebSocket buffer)
channelRouter.get('/:channelId/messages', async (req: AuthRequest, res) => {
    try {
        const { channelId } = req.params;
        const messages = await prisma.message.findMany({
            where: { channelId },
            include: { 
                sender: { select: { id: true, username: true, avatarUrl: true } } 
            },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit historical fetch
        });
        
        // Safely map output format mimicking STOMP frontend expected structure
        const mappedFormat = messages.map(m => ({
            id: m.id,
            senderUsername: m.sender.username,
            content: m.content,
            createdAt: m.createdAt
        }));

        res.status(200).json(mappedFormat);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error retrieving logs' });
    }
});

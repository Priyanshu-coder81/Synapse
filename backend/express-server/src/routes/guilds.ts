import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

export const guildRouter = Router();

// Express Auth Filter equivalent
guildRouter.use(authenticateToken as any);

// POST: Build a Guild network
guildRouter.post('/', async (req: AuthRequest, res) => {
    try {
        const { name, iconUrl } = req.body;
        const userId = req.user!.userId;

        // Prisma Native Transaction -> Creates Server + Default Channel + Member Bind
        const result = await prisma.$transaction(async (tx) => {
            const guild = await tx.guild.create({
                data: {
                    name,
                    iconUrl,
                    ownerId: userId,
                    members: {
                        create: {
                            userId: userId,
                            role: 'OWNER'
                        }
                    },
                    channels: {
                        create: {
                            name: 'general',
                            topic: 'General discussion channel.'
                        }
                    }
                },
                include: {
                    channels: true
                }
            });
            return guild;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error("Create Guild Error:", error);
        res.status(500).json({ message: 'Internal Server Error mapping Guild' });
    }
});

// GET: All active servers connected to User
guildRouter.get('/', async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const guilds = await prisma.guild.findMany({
            where: {
                members: {
                    some: { userId: userId }
                }
            }
        });
        res.status(200).json(guilds);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// GET: Server Layout Specific
guildRouter.get('/:guildId', async (req: AuthRequest, res) => {
    try {
        const { guildId } = req.params;
        const guild = await prisma.guild.findUnique({
            where: { id: guildId },
            include: {
                channels: true,
                members: {
                    include: { user: { select: { id: true, username: true, avatarUrl: true } } }
                }
            }
        });
        
        if (!guild) return res.status(404).json({ message: "Guild not found" });
        res.status(200).json(guild);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

class GuildService {
    async createGuild(data, userId) {
        const { name, description } = data;

        // Transaction: Create Guild and add the creator as OWNER
        return await prisma.$transaction(async (tx) => {
            const guild = await tx.guild.create({
                data: {
                    name,
                    description,
                    ownerId: userId
                }
            });

            await tx.guildMember.create({
                data: {
                    guildId: guild.id,
                    userId: userId,
                    role: "OWNER"
                }
            });

            return guild;
        });
    }

    async getGuild(guildId) {
        const guild = await prisma.guild.findUnique({
            where: { id: guildId },
            include: {
                channels: true,
                _count: {
                    select: { members: true }
                }
            }
        });

        if (!guild) {
            throw new ApiError(404, "Guild not found");
        }

        return guild;
    }

    async getUserGuilds(userId) {
        return await prisma.guild.findMany({
            where: {
                members: {
                    some: { userId }
                }
            },
            include: {
                _count: {
                    select: { members: true }
                }
            }
        });
    }

    async joinByInvite(inviteCode, userId) {
        const guild = await prisma.guild.findUnique({
            where: { inviteCode }
        });

        if (!guild) {
            throw new ApiError(404, "Invalid invite code");
        }

        // Check if already a member
        const existingMember = await prisma.guildMember.findUnique({
            where: {
                userId_guildId: {
                    userId,
                    guildId: guild.id
                }
            }
        });

        if (existingMember) {
            throw new ApiError(400, "You are already a member of this guild");
        }

        return await prisma.guildMember.create({
            data: {
                guildId: guild.id,
                userId,
                role: "MEMBER"
            }
        });
    }

    async deleteGuild(guildId) {
        // Cascade delete will handle members and channels due to schema definition
        return await prisma.guild.delete({
            where: { id: guildId }
        });
    }
}

export default new GuildService();

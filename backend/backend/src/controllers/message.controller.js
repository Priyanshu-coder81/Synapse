import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/**
 * Fetch paginated messages for a channel.
 * Authenticated users who are members of the channel's guild only.
 */
export const getChannelMessages = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { cursor, limit = 50 } = req.query;

    // 1. Verify channel existence and get guildId
    const channel = await prisma.channel.findUnique({
        where: { id: channelId }
    });

    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // 2. Verify membership
    const member = await prisma.guildMember.findUnique({
        where: {
            userId_guildId: {
                userId: req.user.id,
                guildId: channel.guildId
            }
        }
    });

    if (!member) {
        throw new ApiError(403, "You are not a member of this guild");
    }

    // 3. Fetch messages newest first
    const messages = await prisma.message.findMany({
        where: { channelId },
        take: parseInt(limit),
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
            sender: {
                select: { id: true, username: true, avatarUrl: true }
            },
            attachments: true
        }
    });

    // 4. Return with next cursor info
    const nextCursor = messages.length > 0 ? messages[messages.length - 1].id : null;

    return res.status(200).json(
        new ApiResponse(200, {
            messages: messages.reverse(), // Reverse for UI display (oldest to newest in the current batch)
            nextCursor
        }, "Messages fetched successfully")
    );
});

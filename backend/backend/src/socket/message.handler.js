import prisma from "../config/prisma.js";
import { redisPub } from "../config/redis.js";

/**
 * Handles all real-time messaging events for a specific socket connection.
 */
export default (io, socket) => {
    
    // 1. Join a Channel Room
    socket.on("channel:join", async ({ channelId }) => {
        try {
            // Verify membership logic
            const channel = await prisma.channel.findUnique({
                where: { id: channelId },
                include: { guild: true }
            });

            if (!channel) return socket.emit("error", { message: "Channel not found" });

            const member = await prisma.guildMember.findUnique({
                where: {
                    userId_guildId: {
                        userId: socket.data.userId,
                        guildId: channel.guildId
                    }
                }
            });

            if (!member) return socket.emit("error", { message: "You are not a member of this guild" });

            socket.join(`channel:${channelId}`);
            console.log(`📡 Socket ${socket.id} joined channel:${channelId}`);
        } catch (error) {
            socket.emit("error", { message: "Failed to join channel" });
        }
    });

    // 2. Leave a Channel Room
    socket.on("channel:leave", ({ channelId }) => {
        socket.leave(`channel:${channelId}`);
        console.log(`🔌 Socket ${socket.id} left channel:${channelId}`);
    });

    // 3. Send Message
    socket.on("message:send", async ({ channelId, content, attachmentIds }) => {
        try {
            const message = await prisma.message.create({
                data: {
                    content,
                    channelId,
                    senderId: socket.data.userId,
                    attachments: attachmentIds ? {
                        connect: attachmentIds.map(id => ({ id }))
                    } : undefined
                },
                include: {
                    sender: {
                        select: { id: true, username: true, avatarUrl: true }
                    },
                    attachments: true
                }
            });

            const payload = {
                type: "MESSAGE_CREATED",
                payload: message,
                timestamp: new Date().toISOString()
            };

            // Publish to Redis for cross-instance distribution
            await redisPub.publish(`channel:${channelId}`, JSON.stringify(payload));
        } catch (error) {
            console.error("Message Send Error:", error);
            socket.emit("error", { message: "Failed to send message" });
        }
    });

    // 4. Edit Message
    socket.on("message:edit", async ({ messageId, content }) => {
        try {
            const existingMessage = await prisma.message.findUnique({
                where: { id: messageId }
            });

            if (!existingMessage || existingMessage.senderId !== socket.data.userId) {
                return socket.emit("error", { message: "Unauthorized or message not found" });
            }

            const updatedMessage = await prisma.message.update({
                where: { id: messageId },
                data: {
                    content,
                    isEdited: true
                },
                include: {
                    sender: {
                        select: { id: true, username: true, avatarUrl: true }
                    },
                    attachments: true
                }
            });

            const payload = {
                type: "MESSAGE_EDITED",
                payload: updatedMessage,
                timestamp: new Date().toISOString()
            };

            await redisPub.publish(`channel:${updatedMessage.channelId}`, JSON.stringify(payload));
        } catch (error) {
            socket.emit("error", { message: "Failed to edit message" });
        }
    });

    // 5. Delete Message
    socket.on("message:delete", async ({ messageId }) => {
        try {
            const message = await prisma.message.findUnique({
                where: { id: messageId },
                include: { channel: { include: { guild: true } } }
            });

            if (!message) return socket.emit("error", { message: "Message not found" });

            // Allow if sender OR guild owner
            const isSender = message.senderId === socket.data.userId;
            const isOwner = message.channel.guild.ownerId === socket.data.userId;

            if (!isSender && !isOwner) {
                return socket.emit("error", { message: "Unauthorized action" });
            }

            await prisma.message.delete({ where: { id: messageId } });

            const payload = {
                type: "MESSAGE_DELETED",
                payload: { id: messageId, channelId: message.channelId },
                timestamp: new Date().toISOString()
            };

            await redisPub.publish(`channel:${message.channelId}`, JSON.stringify(payload));
        } catch (error) {
            socket.emit("error", { message: "Failed to delete message" });
        }
    });
};

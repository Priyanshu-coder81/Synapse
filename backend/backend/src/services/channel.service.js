import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

class ChannelService {
    async createChannel(guildId, data) {
        const { name, topic } = data;

        // 2. Create the channel
        return await prisma.channel.create({
            data: {
                name,
                topic,
                guildId
            }
        });
    }

    async getChannels(guildId) {
        // 2. Return channels
        return await prisma.channel.findMany({
            where: { guildId }
        });
    }

    async deleteChannel(channelId) {
        return await prisma.channel.delete({
            where: { id: channelId }
        });
    }
}

export default new ChannelService();

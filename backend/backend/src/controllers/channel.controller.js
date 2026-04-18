import channelService from "../services/channel.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { createChannelSchema } from "../validators/guild.validators.js";

export const createChannel = asyncHandler(async (req, res) => {
    const validatedData = createChannelSchema.parse(req.body);
    const channel = await channelService.createChannel(
        req.params.guildId, 
        validatedData
    );
    
    return res.status(201).json(
        new ApiResponse(201, channel, "Channel created successfully")
    );
});

export const getChannels = asyncHandler(async (req, res) => {
    const channels = await channelService.getChannels(req.params.guildId);
    
    return res.status(200).json(
        new ApiResponse(200, channels, "Channels fetched successfully")
    );
});

export const deleteChannel = asyncHandler(async (req, res) => {
    await channelService.deleteChannel(req.params.channelId);
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Channel deleted successfully")
    );
});

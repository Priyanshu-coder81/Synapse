import guildService from "../services/guild.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { createGuildSchema, joinGuildSchema } from "../validators/guild.validators.js";

export const createGuild = asyncHandler(async (req, res) => {
    const validatedData = createGuildSchema.parse(req.body);
    const guild = await guildService.createGuild(validatedData, req.user.id);
    
    return res.status(201).json(
        new ApiResponse(201, guild, "Guild created successfully")
    );
});

export const getUserGuilds = asyncHandler(async (req, res) => {
    const guilds = await guildService.getUserGuilds(req.user.id);
    
    return res.status(200).json(
        new ApiResponse(200, guilds, "User guilds fetched successfully")
    );
});

export const getGuild = asyncHandler(async (req, res) => {
    const guild = await guildService.getGuild(req.params.guildId);
    
    return res.status(200).json(
        new ApiResponse(200, guild, "Guild fetched successfully")
    );
});

export const joinByInvite = asyncHandler(async (req, res) => {
    const membership = await guildService.joinByInvite(req.params.code, req.user.id);
    
    return res.status(200).json(
        new ApiResponse(200, membership, "Joined guild successfully")
    );
});

export const deleteGuild = asyncHandler(async (req, res) => {
    await guildService.deleteGuild(req.params.guildId);
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Guild deleted successfully")
    );
});

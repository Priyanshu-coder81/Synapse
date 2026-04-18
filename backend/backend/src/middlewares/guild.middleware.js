import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Middleware to verify that the user is a member of the guild.
 * Attaches the guildMember object (including role) to req.guildMember.
 */
export const requireMember = asyncHandler(async (req, res, next) => {
    const { guildId } = req.params;
    const userId = req.user.id;

    if (!guildId) {
        throw new ApiError(400, "Guild ID is required");
    }

    const member = await prisma.guildMember.findUnique({
        where: {
            userId_guildId: {
                userId,
                guildId
            }
        }
    });

    if (!member) {
        throw new ApiError(403, "You are not a member of this guild");
    }

    req.guildMember = member; // Attach membership info for the next middleware or controller
    next();
});

/**
 * Parameterized middleware to check if the member has specific roles.
 * @param {string[]} allowedRoles - Array of roles that are allowed (e.g. ['OWNER', 'ADMIN'])
 */
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.guildMember) {
            throw new ApiError(500, "Guild membership not verified. Use requireMember before requireRole.");
        }

        if (!allowedRoles.includes(req.guildMember.role)) {
            throw new ApiError(403, `This action requires one of the following roles: ${allowedRoles.join(", ")}`);
        }

        next();
    };
};

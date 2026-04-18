import { Router } from "express";
import { 
    createGuild, 
    getUserGuilds, 
    getGuild, 
    joinByInvite, 
    deleteGuild 
} from "../controllers/guild.controller.js";
import { createChannel, getChannels, deleteChannel } from "../controllers/channel.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { requireMember, requireRole } from "../middlewares/guild.middleware.js";

const router = Router();

// Secure all guild/channel routes
router.use(verifyJWT);

// Guild Routes
router.route("/")
    .post(createGuild)
    .get(getUserGuilds);

router.route("/:guildId")
    .get(requireMember, getGuild)
    .delete(requireMember, requireRole(["OWNER"]), deleteGuild);

router.post("/join/:code", joinByInvite);

// Channel Routes
router.route("/:guildId/channels")
    .post(requireMember, requireRole(["OWNER", "ADMIN"]), createChannel)
    .get(requireMember, getChannels);

router.delete(
    "/:guildId/channels/:channelId",
    requireMember,
    requireRole(["OWNER", "ADMIN"]),
    deleteChannel
);

export default router;

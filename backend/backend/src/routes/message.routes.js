import { Router } from "express";
import { getChannelMessages } from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/channel/:channelId", getChannelMessages);

export default router;

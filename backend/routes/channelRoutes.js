// Channel routes
import express from "express";
import { createChannel, getChannels } from "../controllers/channelController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createChannel);
router.get("/:serverId", protect, getChannels);

export default router;
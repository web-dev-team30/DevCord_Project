// Server routes
import express from "express";
import { createServer, getMyServers, joinServer } from "../controllers/serverController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createServer);
router.get("/", protect, getMyServers);
router.post("/:id/join", protect, joinServer);

export default router;
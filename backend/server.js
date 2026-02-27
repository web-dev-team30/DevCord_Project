import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import serverRoutes from "./routes/serverRoutes.js";
import channelRoutes from "./routes/channelRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import path from "path";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const frontendOrigins = [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:5174"].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: frontendOrigins,
        credentials: true
    }
});

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: frontendOrigins,
    credentials: true
}));

// Serve Static Files
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/", (req, res) => {
    res.send("DevCord API Running 🚀");
});

// 🔥 SOCKET LOGIC
io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    // Join channel room
    socket.on("joinChannel", (channelId) => {
        socket.join(channelId);
    });

    // Send message
    socket.on("sendMessage", (data) => {
        // The message object from the DB has the channel ID in `data.channel`
        io.to(data.channel).emit("receiveMessage", data);
    });

    // --- WebRTC Logic for Voice Channels ---
    socket.on("join-voice", ({ channelId, userId, userName }) => {
        socket.join(channelId); // Join same room pattern
        // Save userId associated with this socket for disconnect handling
        socket.userId = userId;
        socket.channelId = channelId;

        // Tell everyone ELSE in the room that I connected
        socket.to(channelId).emit("user-connected", { userId, userName });
    });

    socket.on("webrtc-offer", (data) => {
        // Find the target socket using io.sockets and emit to them
        // In a real app we'd map userId -> socketId, but for now we broadcast in the channel
        // and let the client filter by target ID for simplicity.
        socket.to(socket.channelId).emit("webrtc-offer", data);
    });

    socket.on("webrtc-answer", (data) => {
        socket.to(socket.channelId).emit("webrtc-answer", data);
    });

    socket.on("webrtc-ice-candidate", (data) => {
        socket.to(socket.channelId).emit("webrtc-ice-candidate", data);
    });

    socket.on("leave-voice", ({ channelId, userId }) => {
        socket.leave(channelId);
        socket.to(channelId).emit("user-disconnected", userId);
    });

    socket.on("toggle-camera", ({ channelId, userId, isVideoOff }) => {
        socket.to(channelId).emit("user-camera-toggled", { userId, isVideoOff });
    });

    socket.on("toggle-mute", ({ channelId, userId, isMuted }) => {
        socket.to(channelId).emit("user-muted-toggled", { userId, isMuted });
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected:", socket.id);
        if (socket.channelId && socket.userId) {
            socket.to(socket.channelId).emit("user-disconnected", socket.userId);
        }
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
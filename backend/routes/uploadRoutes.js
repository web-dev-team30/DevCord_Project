import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Storage for avatars
const avatarStorage = multer.diskStorage({
    destination(req, file, cb) {
        const dir = "uploads/avatars/";
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename(req, file, cb) {
        cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const avatarUpload = multer({
    storage: avatarStorage,
    fileFilter(req, file, cb) {
        const filetypes = /jpg|jpeg|png|gif|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error("Images only (jpg, jpeg, png, gif, webp)!"));
    },
});

// Storage for general message file attachments
const attachmentStorage = multer.diskStorage({
    destination(req, file, cb) {
        const dir = "uploads/attachments/";
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename(req, file, cb) {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${Date.now()}-${safeName}`);
    },
});

const attachmentUpload = multer({
    storage: attachmentStorage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// POST /api/upload/avatar
router.post("/avatar", protect, avatarUpload.single("avatar"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const user = await User.findById(req.user._id);
        user.avatar = avatarUrl;
        await user.save();

        res.json({
            message: "Avatar uploaded successfully",
            avatar: avatarUrl,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/upload/file
router.post("/file", protect, attachmentUpload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file provided" });
        }

        const fileUrl = `/uploads/attachments/${req.file.filename}`;
        res.json({
            message: "File uploaded successfully",
            url: fileUrl,
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

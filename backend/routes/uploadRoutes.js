import express from "express";
import multer from "multer";
import path from "path";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, "uploads/avatars/");
    },
    filename(req, file, cb) {
        cb(
            null,
            `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`
        );
    },
});

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb("Images only!");
    }
}

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

router.post("/avatar", protect, upload.single("avatar"), async (req, res) => {
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

export default router;

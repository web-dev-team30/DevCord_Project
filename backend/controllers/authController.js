import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";

// Generate Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });
};

// REGISTER
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        const token = generateToken(user._id);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// LOGIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );

        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        await sendEmail(
            user.email,
            "DevCord Password Reset",
            `<h3>Click below to reset password</h3>
       <a href="${resetUrl}">Reset Password</a>`
        );

        res.json({ message: "Reset link sent to email" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(400).json({ message: "Invalid token" });
        }

        user.password = await bcrypt.hash(password, 10);
        await user.save();

        res.json({ message: "Password reset successful" });

    } catch (error) {
        res.status(400).json({ message: "Token expired or invalid" });
    }
};
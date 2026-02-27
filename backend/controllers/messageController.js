import Message from "../models/Message.js";

// Get Messages
export const getMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            channel: req.params.channelId
        }).populate("sender", "name");

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Send Message
export const sendMessage = async (req, res) => {
    try {
        const { content, channelId } = req.body;

        const newMessage = await Message.create({
            sender: req.user._id,
            content: content,
            channel: channelId
        });

        // We need to populate the sender name before sending back the response
        // so the frontend socket can display the user's name immediately
        const populatedMessage = await Message.findById(newMessage._id).populate("sender", "name");

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
import Channel from "../models/Channel.js";

// Create Channel
export const createChannel = async (req, res) => {
    try {
        const channel = await Channel.create({
            name: req.body.name,
            type: req.body.type || 'text',
            server: req.body.serverId
        });

        res.status(201).json(channel);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Channels by Server
export const getChannels = async (req, res) => {
    try {
        const channels = await Channel.find({
            server: req.params.serverId
        });

        res.json(channels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
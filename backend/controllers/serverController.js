import Server from "../models/Server.js";

// Create Server
export const createServer = async (req, res) => {
    try {
        const server = await Server.create({
            name: req.body.name,
            owner: req.user._id,
            members: [req.user._id]
        });

        res.status(201).json(server);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get My Servers
export const getMyServers = async (req, res) => {
    try {
        const servers = await Server.find({
            members: req.user._id
        });

        res.json(servers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Join Server
export const joinServer = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Join request for server: ${id} from user: ${req.user._id}`);

        if (!import('mongoose').then(m => m.default.Types.ObjectId.isValid(id))) {
            // Basic check first, but findById will catch it anyway.
        }

        const server = await Server.findById(id);

        if (!server) {
            console.log(`Server not found: ${id}`);
            return res.status(404).json({ message: "Server not found" });
        }

        if (!server.members.some(m => m.toString() === req.user._id.toString())) {
            server.members.push(req.user._id);
            await server.save();
            console.log(`User ${req.user._id} joined server ${id}`);
        } else {
            console.log(`User ${req.user._id} is already a member of ${id}`);
        }

        res.json(server);
    } catch (error) {
        console.error(`Join error: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};
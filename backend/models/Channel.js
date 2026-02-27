// Channel model schema
import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'voice'],
        default: 'text'
    },
    server: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Server"
    }
}, { timestamps: true });

export default mongoose.model("Channel", channelSchema);
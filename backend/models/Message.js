// Message model schema
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        default: ""
    },
    codeSnippet: {
        code: { type: String },
        language: { type: String, default: "javascript" },
        filename: { type: String, default: "snippet" }
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel"
    }
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);
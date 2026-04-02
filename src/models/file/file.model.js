import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
    path: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    directory: {
        type: String,
        default: 'public'
    },
    contentType: {
        type: String,
        default: 'application/octet-stream'
    },
    description: {
        type: String,
        trim: true
    },
    // Binary Media Storage
    media: {
        type: Buffer,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

export const File = mongoose.model("File", fileSchema);

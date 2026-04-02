import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['image', 'pdf', 'other'],
        default: 'other'
    },
    description: {
        type: String,
        trim: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

export const File = mongoose.model("File", fileSchema);

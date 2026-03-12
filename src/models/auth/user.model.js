import mongoose from "mongoose";

const userSchema = mongoose.Schema({

        google_id: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        image_url: {
            type: String,
        },
        role: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["user", "admin", "superadmin"],
        },
        status_id: {   // 0 - no profile, 1 - has profile,
            type: Number,
            required: true,
        },
        is_active: {
            type: Boolean,
            required: true,
            default: true,
        },
        token: {
            type: String,
            unique: true,
        },
    }, {timestamps: true}
);


export const User = mongoose.model("User", userSchema);
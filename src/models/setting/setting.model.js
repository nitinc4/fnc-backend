import mongoose from "mongoose";

const settingSchema = mongoose.Schema({
    owner: {
        type: String,
        default: "",
    },
    about: {
        type: String,
        default: "",
    },
    profile: {
        type: String,
        default: "",
    },
    logo: {
        type: String,
        default: "",
    },
    phone: {
        type: String,
        default: "",
    },
    email: {
        type: String,
        default: "",
    },
    address: {
        type: String,
        default: "",
    },
    whatsapp: {
        type: String,
        default: "",
    },
    facebook: {
        type: String,
        default: "",
    },
    instagram: {
        type: String,
        default: "",
    },
    twitter: {
        type: String,
        default: "",
    },
    website: {
        type: String,
        default: "",
    },
    privacy: {
        type: String,
        default: "",
    },
    // Add these inside your existing Setting schema:
    upi_id: { type: String, default: "yourname@upi" },
    payee_name: { type: String, default: "FNC " },
    subscription_amount: { type: Number, default: 999 },

}, { timestamps: true });

export const Setting = mongoose.model("Setting", settingSchema);
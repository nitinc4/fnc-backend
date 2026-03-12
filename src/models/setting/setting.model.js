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

}, {timestamps: true});

export const Setting = mongoose.model("Setting", settingSchema);
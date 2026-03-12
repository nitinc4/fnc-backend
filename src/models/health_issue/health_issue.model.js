import mongoose from "mongoose";

const healthIssueSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    cause: {
        type: String,
        required: true,
    },
    risk_factor: {
        type: Number,
        required: true,
    },
    treatment: {
        type: String,
        required: true,
    },

}, { timestamps: true })



export const HealthIssue = mongoose.model('HealthIssue', healthIssueSchema)
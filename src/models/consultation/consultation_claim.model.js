import mongoose from "mongoose";

const consultationClaimSchema = mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        plan_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Plan",
            required: true,
        },
        claim_code: {
            type: String,
            required: true,
            uppercase: true,
            minlength: 6,
            maxlength: 6,
            unique: true,
            index: true,
        },
        status: {
            type: String,
            required: true,
            enum: ["Pending", "Redeemed", "Expired"],
            default: "Pending",
        },
    },
    { timestamps: true }
);

export const ConsultationClaim = mongoose.model("ConsultationClaim", consultationClaimSchema);

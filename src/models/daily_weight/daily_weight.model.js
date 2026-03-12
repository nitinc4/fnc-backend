import mongoose from "mongoose";

const dailyWeightSchema =  mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    weight: {
        type: Number,
        required: true
    },


}, { timestamps: true });

export const DailyWeight = mongoose.model("DailyWeight", dailyWeightSchema);
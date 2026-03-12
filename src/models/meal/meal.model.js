import mongoose from "mongoose";

const mealSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: String,
    start_time: {
        type: Date,
        required: true,
    },
    end_time: {
        type: Date,
        required: true,
    },
}, { timestamps: true }
);

export const Meal = mongoose.model("Meal", mealSchema);
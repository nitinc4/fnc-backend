import mongoose from "mongoose";
import {FoodQuantitySchema} from "../food/food_quantity.model.js";


const dietPlanSchema = mongoose.Schema({
    created_by: {
        type: mongoose.Schema.Types.ObjectId, ref: "User", required: true,
    },
    name: {
        type: String, required: true,
    },
    description: String,
    start_date: {
        type: Date, required: true,
    },
    end_date: {
        type: Date, required: true,
    },
    health_issues: [{
        type: mongoose.Schema.Types.ObjectId, ref: "HealthIssue",
    }],
    breakfast: [FoodQuantitySchema],
    morning_snacks: [FoodQuantitySchema],
    lunch: [FoodQuantitySchema],
    evening_snacks: [FoodQuantitySchema],
    dinner: [FoodQuantitySchema],
    water: {
        type: Number,
        required: true,
    },
}, {timestamps: true});

export const DietPlan = mongoose.model("DietPlan", dietPlanSchema);
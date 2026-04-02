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
    variant: {
        type: String,
        enum: ['Weight Loss', 'Weight Gain', 'Maintain Weight'],
        required: true,
        default: 'Maintain Weight'
    },
    dietary_option: {
        type: String,
        enum: ['Veg', 'Non-Veg', 'Vegan'],
        required: true,
        default: 'Veg'
    },
    breakfast: [FoodQuantitySchema],
    lunch: [FoodQuantitySchema],
    dinner: [FoodQuantitySchema],
    water_target: {
        type: Number,
        required: true,
        default: 10
    },
    green_tea_target: {
        type: Number,
        required: true,
        default: 4
    },
    black_coffee_target: {
        type: Number,
        required: true,
        default: 2
    },
}, {timestamps: true});

export const DietPlan = mongoose.model("DietPlan", dietPlanSchema);
import mongoose from "mongoose";
import {FoodQuantitySchema} from "../food/food_quantity.model.js";


const dailyDietSchema = mongoose.Schema({
    created_by: {
        type: mongoose.Schema.Types.ObjectId, ref: "User", required: true,
    },
    water: {
        type: Number,
        required: true,
    },
    green_tea: {
        type: Number,
        default: 0,
    },
    black_coffee: {
        type: Number,
        default: 0,
    },
    breakfast: [FoodQuantitySchema],
    lunch: [FoodQuantitySchema],
    dinner: [FoodQuantitySchema],
}, {timestamps: true});

export const DailyDiet =  mongoose.model("DailyDiet", dailyDietSchema);
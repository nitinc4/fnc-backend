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
    breakfast: [FoodQuantitySchema],
    morning_snacks: [FoodQuantitySchema],
    lunch: [FoodQuantitySchema],
    evening_snacks: [FoodQuantitySchema],
    dinner: [FoodQuantitySchema],
}, {timestamps: true});

export const DailyDiet =  mongoose.model("DailyDiet", dailyDietSchema);

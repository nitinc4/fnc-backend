import mongoose from "mongoose";

const dietFoodSchema = mongoose.Schema({
    food_id: {
        type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true
    }, quantity: {
        type: Number, required: true
    }
}, { _id: false })


export const FoodQuantitySchema = dietFoodSchema;
import mongoose from "mongoose";

const foodNutrientSchema = mongoose.Schema({
    nutrient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Nutrient',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    }
},{_id: false});

const foodSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: String,
    meals: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Meal',
            required: true,
            unique:false
        }
    ],
    nutrients_per_quantity: {
        type: Number,
        required: true,
    },
    calories_per_quantity: {
        type: Number,
        required: true,
    },
    serving: {
        type: Number,
        required: true,
    },
    nutrients: [
        foodNutrientSchema
    ],
}, {timestamps: true});

export const Food = mongoose.model("Food", foodSchema);

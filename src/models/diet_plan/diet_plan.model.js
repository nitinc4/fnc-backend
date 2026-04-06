import mongoose from "mongoose";

const mealItemSchema = new mongoose.Schema({
    food_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
    quantity: { type: Number, default: 1 }
}, { _id: false });

const dietPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    health_issues: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthIssue'
    }],
    variant: {
        type: String,
        enum: ['Weight Loss', 'Weight Gain', 'Weight Maintenance'],
        default: 'Weight Maintenance'
    },
    dietary_option: {
        type: String,
        enum: ['veg', 'non veg', 'vegan', 'all'],
        default: 'all'
    },
    breakfast: {
        veg: [mealItemSchema],
        non_veg: [mealItemSchema],
        vegan: [mealItemSchema]
    },
    lunch: {
        veg: [mealItemSchema],
        non_veg: [mealItemSchema],
        vegan: [mealItemSchema]
    },
    dinner: {
        veg: [mealItemSchema],
        non_veg: [mealItemSchema],
        vegan: [mealItemSchema]
    },
    water: {
        type: Number,
        default: 10
    },
    green_tea_target: {
        type: Number,
        default: 4
    },
    black_coffee_target: {
        type: Number,
        default: 2
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

export const DietPlan = mongoose.model("DietPlan", dietPlanSchema);

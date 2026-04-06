import mongoose from "mongoose";

const mealPlanSchema = [{
    food_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
    quantity: { type: Number, default: 1 }
}];

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
        veg: mealPlanSchema,
        non_veg: mealPlanSchema,
        vegan: mealPlanSchema
    },
    lunch: {
        veg: mealPlanSchema,
        non_veg: mealPlanSchema,
        vegan: mealPlanSchema
    },
    dinner: {
        veg: mealPlanSchema,
        non_veg: mealPlanSchema,
        vegan: mealPlanSchema
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

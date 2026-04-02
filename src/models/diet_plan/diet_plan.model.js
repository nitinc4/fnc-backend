import mongoose from "mongoose";

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
        enum: ['weight loss', 'weight gain', 'maintain weight'],
        default: 'maintain weight'
    },
    dietary_option: {
        type: String,
        enum: ['veg', 'non-veg', 'vegan'],
        default: 'veg'
    },
    breakfast: [{
        food_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
        quantity: { type: Number, default: 1 }
    }],
    lunch: [{
        food_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
        quantity: { type: Number, default: 1 }
    }],
    dinner: [{
        food_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
        quantity: { type: Number, default: 1 }
    }],
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

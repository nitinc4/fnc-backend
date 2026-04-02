import mongoose from "mongoose";

const dailyDietSchema = new mongoose.Schema({
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    breakfast: [{
        food_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
        quantity: { type: Number, default: 1 },
        unit: { type: String, default: 'unit' }
    }],
    lunch: [{
        food_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
        quantity: { type: Number, default: 1 },
        unit: { type: String, default: 'unit' }
    }],
    dinner: [{
        food_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
        quantity: { type: Number, default: 1 },
        unit: { type: String, default: 'unit' }
    }],
    water: {
        type: Number,
        default: 0
    },
    green_tea: {
        type: Number,
        default: 0
    },
    black_coffee: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export const DailyDiet = mongoose.model("DailyDiet", dailyDietSchema);

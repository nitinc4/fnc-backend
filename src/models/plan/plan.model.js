import mongoose, {Mongoose} from "mongoose";

const planSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    images: [
        String,
    ],
    duration: {
        type: Number,
        required: true,
    },
    diet_plan :
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DietPlan',
        default: null
    },
}, { timestamps: true });

export const Plan = mongoose.model("Plan", planSchema);
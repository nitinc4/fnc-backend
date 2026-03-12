import mongoose from "mongoose";

const nutrientSchema =  mongoose.Schema({
        name: {
            type: String,
            required: true,
            lowercase: true,
        },
        type: {
            type: String,
            required: true,
            lowercase: true,
            enums: ['macro', 'micro']
        }
    },
    {
        timestamps: true
    }
)

export const Nutrient = mongoose.model('Nutrient', nutrientSchema);

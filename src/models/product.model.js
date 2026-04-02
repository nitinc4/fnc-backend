import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: String,
        default: 'FNC'
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    images: {
        type: [String],
        default: []
    },
    category: {
        type: String,
        default: 'General'
    },
    stock: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export const Product = mongoose.model("Product", productSchema);

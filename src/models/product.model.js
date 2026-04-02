import mongoose from "mongoose";

const productSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: String, // Stores HTML string as per Shopify data
    price: {
        type: Number,
        required: true,
    },
    images: [String], // Array of image URLs
    brand: String,
    is_manual: {
        type: Boolean,
        default: false
    },
    product_url: {
        type: String,
        unique: true,
        sparse: true
    }
}, { timestamps: true });

export const Product = mongoose.model("Product", productSchema);
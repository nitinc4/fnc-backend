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
    },
    product_url: {
        type: String,
        unique: true,
        sparse: true
    }
}, {
    timestamps: true
});

productSchema.pre('save', function(next) {
    if (!this.product_url) {
        // Generate a unique placeholder to satisfy the legacy index
        this.product_url = `legacy_index_bypass_${this._id}_${Date.now()}`;
    }
    next();
});

export const Product = mongoose.model("Product", productSchema);

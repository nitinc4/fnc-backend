import mongoose from "mongoose";

const productReviewSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewer_name: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

// Ensure a user can only review a product once
productReviewSchema.index({ product_id: 1, user_id: 1 }, { unique: true });

export const ProductReview = mongoose.model("ProductReview", productReviewSchema);

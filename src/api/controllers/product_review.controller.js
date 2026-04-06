import { ProductReview } from "../../models/product_review.model.js";
import { User } from "../../models/auth/user.model.js";
import ApiResponse from "../../utils/api_response.js";
import mongoose from "mongoose";

class ProductReviewController {

    static async create(req, res) {
        try {
            const { product_id, user_id, rating, comment } = req.body;

            if (!product_id || !user_id || !rating || !comment) {
                return res.status(400).json(ApiResponse.error('Missing required fields (product_id, rating, comment)'));
            }

            // Find user to get their name
            const user = await User.findById(user_id);
            if (!user) return res.status(404).json(ApiResponse.error('User not found'));

            const review = new ProductReview({
                product_id,
                user_id,
                reviewer_name: user.name || 'Anonymous',
                rating: Number(rating),
                comment
            });

            await review.save();
            return res.status(201).json(ApiResponse.success('Review added successfully', review));
        } catch (e) {
            if (e.code === 11000) {
                return res.status(400).json(ApiResponse.error('You have already reviewed this product.'));
            }
            return res.status(500).json(ApiResponse.error(e.message || 'Error occurred while adding review'));
        }
    }

    static async getByProduct(req, res) {
        try {
            const { productId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json(ApiResponse.error('Invalid Product ID'));
            }

            const reviews = await ProductReview.find({ product_id: productId }).sort({ createdAt: -1 });
            return res.status(200).json(ApiResponse.success('Reviews retrieved successfully', reviews));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Error occurred while fetching reviews'));
        }
    }

    static async delete(req, res) {
        try {
            const { reviewId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(reviewId)) {
                return res.status(400).json(ApiResponse.error('Invalid Review ID'));
            }

            const review = await ProductReview.findByIdAndDelete(reviewId);
            if (!review) return res.status(404).json(ApiResponse.error('Review not found'));

            return res.status(200).json(ApiResponse.success('Review deleted successfully by admin'));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Error occurred while deleting review'));
        }
    }

    static async getAll(req, res) {
        try {
            const reviews = await ProductReview.find()
                .populate('product_id', 'title')
                .populate('user_id', 'name email')
                .sort({ createdAt: -1 });
            return res.status(200).json(ApiResponse.success('All reviews retrieved successfully', reviews));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Error occurred while fetching all reviews'));
        }
    }
}

export default ProductReviewController;

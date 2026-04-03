import { Product } from "../../models/product.model.js";
import ApiResponse from "../../utils/api_response.js";
import mongoose from "mongoose";

class ProductController {
    static async create(req, res) {
        try {
            const product = new Product(req.body);
            await product.save();
            return res.status(201).json(ApiResponse.success('Product created successfully', product));
        } catch (e) {
            if (e.name === 'ValidationError') {
                return res.status(400).json(ApiResponse.error(e.message));
            }
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    static async getAll(req, res) {
        try {
            const products = await Product.find({ isActive: true });
            return res.status(200).json(ApiResponse.success('Products retrieved successfully', products));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    static async getById(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id))
                return res.status(400).json(ApiResponse.error('Invalid ID format'));

            const product = await Product.findById(req.params.id);
            if (!product) return res.status(404).json(ApiResponse.error('Product not found'));
            return res.status(200).json(ApiResponse.success('Product retrieved successfully', product));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    static async update(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id))
                return res.status(400).json(ApiResponse.error('Invalid ID format'));

            const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!product) return res.status(404).json(ApiResponse.error('Product not found'));
            return res.status(200).json(ApiResponse.success('Product updated successfully', product));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    static async delete(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id))
                return res.status(400).json(ApiResponse.error('Invalid ID format'));

            const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false });
            if (!product) return res.status(404).json(ApiResponse.error('Product not found'));
            return res.status(200).json(ApiResponse.success('Product deleted successfully'));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }
}

export default ProductController;

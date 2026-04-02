// src/api/controllers/product.controller.js
const Product = require('../../models/product.model');
const ApiResponse = require('../utils/ApiResponse');

class ProductController {
    static async createProduct(req, res) {
        try {
            const product = new Product(req.body);
            await product.save();
            return res.status(201).json(ApiResponse.success(product, 'Product created successfully'));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    static async getProducts(req, res) {
        try {
            const products = await Product.find({ isActive: true });
            return res.status(200).json(ApiResponse.success(products));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    static async getProductById(req, res) {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) return res.status(404).json(ApiResponse.error('Product not found'));
            return res.status(200).json(ApiResponse.success(product));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    static async updateProduct(req, res) {
        try {
            const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!product) return res.status(404).json(ApiResponse.error('Product not found'));
            return res.status(200).json(ApiResponse.success(product, 'Product updated successfully'));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    static async deleteProduct(req, res) {
        try {
            const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false });
            if (!product) return res.status(404).json(ApiResponse.error('Product not found'));
            return res.status(200).json(ApiResponse.success(null, 'Product deleted successfully'));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }
}

module.exports = ProductController;

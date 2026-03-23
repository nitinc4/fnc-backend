import ApiResponse from "../../utils/api_response.js";
import { Product } from "../../models/product.model.js";
import { fetchShopifyProductData } from "../../utils/product_fetcher.js";
import mongoose from "mongoose";

class ProductController {
    static async addProductByUrl(req, res) {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json(ApiResponse.error("Product URL is required"));
        }

        try {
            // Check if product already exists to avoid duplicates
            const existing = await Product.findOne({ product_url: url });
            if (existing) {
                return res.status(400).json(ApiResponse.error("Product already exists in database"));
            }

            // Fetch data using the utility
            const productData = await fetchShopifyProductData(url);

            // Save to DB
            const newProduct = await Product.create(productData);

            return res.status(201).json(ApiResponse.success("Product added successfully", newProduct));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message));
        }
    }

    static async getAllProducts(req, res) {
        try {
            const products = await Product.find().sort({ createdAt: -1 });
            return res.status(200).json(ApiResponse.success("Products retrieved", products));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message));
        }
    }

    static async deleteProduct(req, res) {
        try {
            const { id } = req.params;

            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json(ApiResponse.error("Invalid product id"));
            }

            const deletedProduct = await Product.findByIdAndDelete(id);
            if (!deletedProduct) {
                return res.status(404).json(ApiResponse.error("Product not found"));
            }

            return res.status(200).json(ApiResponse.success("Product deleted successfully", deletedProduct));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message));
        }
    }
}

export default ProductController;

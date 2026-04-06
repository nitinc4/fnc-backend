import express from "express";
import ProductReviewController from "../controllers/product_review.controller.js";
import { authenticateRequest } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

// Get reviews for a specific product - Public
router.get("/product/:productId", ProductReviewController.getByProduct);

// Authenticated routes
router.use(authenticateRequest);

// Create a review
router.post("/", ProductReviewController.create);

// Delete review - Admin only
router.delete("/:reviewId", isAdmin, ProductReviewController.delete);

export default router;

import { Router } from "express";
import ProductController from "../controllers/product.controller.js";

const router = Router();

router.post("/add-by-url", ProductController.addProductByUrl);
router.get("/", ProductController.getAllProducts);

export default router;
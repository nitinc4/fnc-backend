import { Router } from "express";
import ProductController from "../controllers/product.controller.js";

const router = Router();

router.post("/add-by-url", ProductController.addProductByUrl);
router.post("/create-manual", ProductController.createManualProduct);
router.get("/", ProductController.getAllProducts);
router.delete("/:id", ProductController.deleteProduct);

export default router;

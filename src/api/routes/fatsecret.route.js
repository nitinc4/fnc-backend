import express from "express";
import FatSecretController from "../controllers/fatsecret.controller.js";

const router = express.Router();

router.post("/recommendations", FatSecretController.getRecommendations);
router.get("/search", FatSecretController.search);

export default router;

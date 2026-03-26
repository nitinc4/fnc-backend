import express from "express";
import FatSecretController from "../controllers/fatsecret.controller.js";

const router = express.Router();

router.post("/recommendations", FatSecretController.getRecommendations);

export default router;

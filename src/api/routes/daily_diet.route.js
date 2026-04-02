import express from "express";
import DailyDietController from "../controllers/daily_diet.controller.js";

const router = express.Router();

router.get("/", DailyDietController.getDiet);
router.post("/", DailyDietController.create);
router.post("/water", DailyDietController.addWater);
router.post("/green-tea", DailyDietController.addGreenTea);
router.post("/black-coffee", DailyDietController.addBlackCoffee);
router.put("/:id", DailyDietController.update);
router.delete("/:id", DailyDietController.delete);

export default router;

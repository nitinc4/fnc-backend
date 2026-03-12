import express from "express";
import DailyWeightController from "../controllers/daily_weight.controller.js";
const router = express.Router();

router.get("/", DailyWeightController.getWeightData)

router.get("/range", DailyWeightController.getWeightDataOfDateRange)

router.post("/", DailyWeightController.createDailyWeight)

router.put("/:id", DailyWeightController.updateDailyWeight)

router.delete("/:id", DailyWeightController.deleteDailyWeight)

export default router;
import express from "express";
import DailyDietController from "../controllers/daily_diet.controller.js";

const router = express.Router();

router.get("/", DailyDietController.getDiet)

router.post("/", DailyDietController.create)

router.put("/", DailyDietController.update)

router.post("/water", DailyDietController.addWater)

router.delete("/:id", DailyDietController.delete)

export default router;
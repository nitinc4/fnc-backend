import express from "express";
import DietPlanController from "../controllers/diet_plan.controller.js";

const router = express.Router();

router.get("/", DietPlanController.getDietPlans)

router.get("/:id", DietPlanController.getDietPlan)

router.post("/", DietPlanController.createDietPlan)

router.put("/:id", DietPlanController.updateDietPlan)

router.delete("/:id", DietPlanController.deleteDietPlan)

export default router;
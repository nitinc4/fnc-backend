import express from "express";
import NutrientController from "../controllers/nutrient.controller.js";

const router = express.Router()

//get all nutrients
router.get("/", NutrientController.getNutrients)

router.get("/:id", NutrientController.getNutrient)

router.post("/", NutrientController.createNutrient)

router.put("/:id", NutrientController.updateNutrient)

router.delete("/:id", NutrientController.deleteNutrient)


export default router;
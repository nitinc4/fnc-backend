import express from "express";
import MealController from "../controllers/meal.controller.js";

const router = express.Router();


router.get('/',MealController.getMeals)

router.get('/:id',MealController.getMeal)

router.post('/',MealController.createMeal)

router.put('/:id',MealController.updateMeal)

router.delete('/:id',MealController.deleteMeal)


export default router;
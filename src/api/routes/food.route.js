import express from "express";
import FoodController from "../controllers/food.controller.js";

const router = express.Router()


router.get('/:id', FoodController.getFood)

router.get('/', FoodController.getFoods)

router.post('/', FoodController.createFood)

router.put('/:id',FoodController.updateFood)

router.delete('/:id',FoodController.deleteFood)

export default router;
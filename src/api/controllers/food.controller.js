import ApiResponse from "../../utils/api_response.js";
import {Food} from "../../models/food/food.model.js";
import mongoose from "mongoose";
import {Nutrient} from "../../models/nutrient.model.js";
import {Meal} from "../../models/meal/meal.model.js";

function isDuplicateNutrient(nutrients, nutrient_id) {
    for (const nutrient of nutrients) {
        if (nutrient.nutrient_id === nutrient_id)
            return true;
    }
    return false;

}

function checkDuplicateMeals(meals) {
    let exist = false
    let uniqueMeals = new Set();
    meals.filter(item => {
        if (uniqueMeals.has(item)) {
            exist = true;
            return;
        }
        uniqueMeals.add(item); // Otherwise, add it to the set
        exist = false;

    });
    return exist;
}

class FoodController {

    static async getFood(req, res) {
        const {id} = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json(ApiResponse.error('Invalid food id'));
        try {

            const food = await Food.findById(id).select('-__v -updatedAt -createdAt').populate({
                path: 'meals',
                select: 'name description start_time end_time'
            }).populate({
                path: 'nutrients',

                populate: {
                    path: 'nutrient_id',
                    select: '_id name type',
                }
            })


            if (!food)
                return res.status(400).json(ApiResponse.error('Food not found'));

            return res.status(200).json(ApiResponse.success('Food retrieved successfully', food));

        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'));
        }

    }

    static async getFoods(req, res) {
        const {name} = req.query;

        try {


            let food;
            if (name !== undefined && name !== '' && name !== 'null') {

                console.log('searchParam', name)
                food = await Food.find({
                    name: {
                        $regex: name,
                        $options: 'i'
                    }

                }).select('-__v -updatedAt -createdAt').populate({
                    path: 'meals',
                    select: 'name description start_time end_time'
                }).populate({
                    path: 'nutrients',

                    populate: {
                        path: 'nutrient_id',
                        select: '_id name type',
                    }
                })
            } else {

                food = await Food.find().select('-__v -updatedAt -createdAt').populate({
                    path: 'meals',
                    select: 'name description start_time end_time'
                }).populate({
                    path: 'nutrients',
                    populate: {
                        path: 'nutrient_id',
                        select: '_id name type',
                    }
                })
            }


            return res.status(200).json(ApiResponse.success('Food retrieved successfully', food));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'));
        }

    }


    static async createFood(req, res) {

        const {name, description, meals, quantity, serving, nutrients, calories} = req.body;


        if (!name)
            return res.status(400).json(ApiResponse.error('{ name } is required'))

        if (!description)
            return res.status(400).json(ApiResponse.error('{ description } is required'))

        if (!meals)
            return res.status(400).json(ApiResponse.error('{ meals } is required'))

        if (!calories)
            return res.status(400).json(ApiResponse.error('{ calories } is required'))

        if (!Array.isArray(meals))
            return res.status(400).json(ApiResponse.error('{ meals } excepts only array'))

        if (meals.length === 0)
            return res.status(400).json(ApiResponse.error('At least one meal should be pass in { meals }'))

        //check duplicate meals
        const isDuplicateMeals = checkDuplicateMeals(meals)

        if (isDuplicateMeals)
            return res.status(400).json(ApiResponse.error('two or more meals are same'))


        if (!quantity)
            return res.status(400).json(ApiResponse.error('{ quantity } is required'))

        if (!serving)
            return res.status(400).json(ApiResponse.error('{ serving } is required'))

        if (!nutrients)
            return res.status(400).json(ApiResponse.error('{ nutrients } is required'))

        if (!Array.isArray(nutrients))
            return res.status(400).json(ApiResponse.error('{ nutrients } must be an array'))

        if (nutrients.length === 0)
            return res.status(400).json(ApiResponse.error('{ nutrients } array cannot be empty'))


        try {

            //extract meal id
            let mealList = []
            for (const meal of meals) {
                if (!mongoose.Types.ObjectId.isValid(meal))
                    return res.status(400).json(ApiResponse.error('Invalid meals { id } try checking from meals'))

                const checkMealExistence = await Meal.findById(meal);
                if (!checkMealExistence)
                    return res.status(400).json(ApiResponse.error('Meal does not exist with id: ' + meal))

                mealList.push(checkMealExistence)

            }


            //checking for nutrients
            let nutrientList = [];
            for (const nutrient of nutrients) {
                if (isDuplicateNutrient(nutrientList, nutrient.nutrient_id))
                    return res.status(400).json(ApiResponse.error('Duplicate nutrient at index of ' + (nutrients.indexOf(nutrient) + 1)))

                if (!nutrient.nutrient_id)
                    return res.status(400).json(ApiResponse.error('Nutrient { nutrient_id } is required'))
                if (!nutrient.quantity)
                    return res.status(400).json(ApiResponse.error('Nutrient { quantity } is required'))

                if (!mongoose.Types.ObjectId.isValid(nutrient.nutrient_id))
                    return res.status(400).json(ApiResponse.error('Invalid nutrient id at index of ' + (nutrients.indexOf(nutrient) + 1)))

                const checkNutrientExistence = await Nutrient.findById(nutrient.nutrient_id);

                if (!checkNutrientExistence)
                    return res.status(400).json(ApiResponse.error('Nutrient is invalid at index of ' + (nutrients.indexOf(nutrient) + 1) + ' try fetching nutrients'))

                nutrientList.push(nutrient)
            }


            //check if food exist
            const isExistingFood = await Food.findOne({name});
            if (isExistingFood)
                return res.status(400).json(ApiResponse.error('Food already exists, please use a different name'));


            console.log(mealList)


            const createdFood = await Food.create({
                name,
                description,
                meals: mealList,
                nutrients_per_quantity: quantity,
                calories_per_quantity: calories,
                serving,
                nutrients: nutrientList,
            });

            if (!createdFood)
                return res.status(400).json(ApiResponse.error('Failed to create food'))


            const food = await Food.findById(createdFood._id).select('-__v -updatedAt -createdAt').populate({
                path: 'meals',
                select: 'name description start_time end_time'
            }).populate({
                path: 'nutrients',

                populate: {
                    path: 'nutrient_id',
                    select: '_id name type',
                }
            })


            return res.status(200).json(ApiResponse.success('Food created successfully', food));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'));
        }
    }


    static async updateFood(req, res) {
        const {id} = req.params
        const {name, description, meals, quantity, serving, calories, nutrients} = req.body;


        if (!id)
            return res.status(400).json(ApiResponse.error('food id is required to update'))

        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json(ApiResponse.error('Invalid food id'))


        if (meals) {

            if (!Array.isArray(meals))
                return res.status(400).json(ApiResponse.error('{ meals } excepts only array'))

            if (meals.length === 0)
                return res.status(400).json(ApiResponse.error('{ meals } array cannot be empty'))


            const isDuplicateMeals = checkDuplicateMeals(meals)

            //check duplicate meals
            if (isDuplicateMeals)
                return res.status(400).json(ApiResponse.error('two or more meals are same'))


        }


        if (nutrients) {

            if (!Array.isArray(nutrients))
                return res.status(400).json(ApiResponse.error('{ nutrients } must be an array'))

            if (nutrients.length === 0)
                return res.status(400).json(ApiResponse.error('{ nutrients } array cannot be empty'))

        }

        try {

            const existingFood = await Food.findById(id);

            if (!existingFood)
                return res.status(400).json(ApiResponse.error('Food not found'))

            if (name) existingFood.name = name;

            if (description) existingFood.description = description;

            if (quantity) existingFood.nutrients_per_quantity = quantity;

            if (serving) existingFood.serving = serving;

            if (calories) existingFood.calories_per_quantity = calories;

            if (meals) {
                let mealList = []
                for (const meal of meals) {
                    if (!mongoose.Types.ObjectId.isValid(meal))
                        return res.status(400).json(ApiResponse.error('Invalid meals { id } try checking from meals'))

                    const checkMealExistence = await Meal.findById(meal);
                    if (!checkMealExistence)
                        return res.status(400).json(ApiResponse.error('Meal does not exist with id: ' + meal))

                    mealList.push(checkMealExistence)

                }
                existingFood.meals = mealList;
            }


            if (nutrients) {
                let nutrientList = [];
                for (const nutrient of nutrients) {
                    if (!nutrient.nutrient_id)
                        return res.status(400).json(ApiResponse.error('Nutrient { nutrient_id } is required'))
                    if (!nutrient.quantity)
                        return res.status(400).json(ApiResponse.error('Nutrient { quantity } is required'))

                    if (isDuplicateNutrient(nutrientList, nutrient.nutrient_id))
                        return res.status(400).json(ApiResponse.error('Duplicate nutrient at index of ' + (nutrients.indexOf(nutrient) + 1)))


                    if (!mongoose.Types.ObjectId.isValid(nutrient.nutrient_id))
                        return res.status(400).json(ApiResponse.error('Invalid nutrient id at index of ' + (nutrients.indexOf(nutrient) + 1)))

                    const checkNutrientExistence = await Nutrient.findById(nutrient.nutrient_id);

                    if (!checkNutrientExistence)
                        return res.status(400).json(ApiResponse.error('Nutrient is invalid at index of ' + (nutrients.indexOf(nutrient) + 1) + ' try fetching nutrients'))

                    nutrientList.push(nutrient)
                }
                existingFood.nutrients = nutrientList;
            }

            await existingFood.save({validateBeforeSave: false});
            const food = await Food.findById(id).select('-__v -updatedAt -createdAt').populate({
                path: 'meals',
                select: 'name description start_time end_time'
            }).populate({
                path: 'nutrients',

                populate: {
                    path: 'nutrient_id',
                    select: '_id name type',
                }
            })

            return res.status(200).json(ApiResponse.success('Food updated successfully', food));


        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal Server Error'))

        }

    }


    static async deleteFood(req, res) {
        //TODO: check for usage in other places
        const {id} = req.params;
        if (!id)
            return res.status(400).json(ApiResponse.error('Food id is required'));

        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json(ApiResponse.error('Invalid food id'));
        try {
            const food = await Food.findByIdAndDelete(id).select('-__v -updatedAt -createdAt');
            if (!food)
                return res.status(400).json(ApiResponse.error('Food not found'));
            return res.status(200).json(ApiResponse.success('Food deleted successfully', food));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'));
        }
    }
}


export default FoodController;
import {Meal} from "../../models/meal/meal.model.js";
import ApiResponse from "../../utils/api_response.js";
import mongoose from "mongoose";
import {getDate_24_HH_MM, getDateFromMongo} from "../../utils/date_time_utils.js";


class MealController {

    static async getMeals(req, res) {
        try {
            const meals = await Meal.find().select('-__v -updatedAt -createdAt');
            if (!meals)
                return res.status(400).json(ApiResponse.error('Meals not found'));

            return res.status(200).json(ApiResponse.success('Meals retrieved successfully', meals));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'));
        }

    }

    static async getMeal(req, res) {
        const {id} = req.params;
        if (!id)
            return res.status(400).json(ApiResponse.error('Meal id is required'));
        try {
            if (!mongoose.Types.ObjectId.isValid(id))
                return res.status(400).json(ApiResponse.error('Invalid meal id'));

            const meal = await Meal.findById(id).select('-__v -updatedAt -createdAt');

            if (!meal)
                return res.status(400).json(ApiResponse.error('Meal not found'))

            return res.status(200).json(ApiResponse.success(`Meal Found`, meal))
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'));
        }
    }

    static async createMeal(req, res) {
        const {name, description, start_time, end_time} = req.body;

        //validate request
        if (!name || !description || !start_time || !end_time)
            return res.status(400).json(ApiResponse.error('All fields are required { name,description,start_time,end_time }'));

        let start = getDate_24_HH_MM(start_time)
        let end = getDate_24_HH_MM(end_time)

        try {

            const ifMealExist = await Meal.findOne({name})

            if (ifMealExist)
                return res.status(400).json(ApiResponse.error('Meal already exist'));

            const createdMeal = await Meal.create({
                name,
                description,
                start_time: start,
                end_time: end,
            });

            if (!createdMeal)
                return res.status(400).json(ApiResponse.error('Meal not created'))


            const fetchedMeal = await Meal.findById(createdMeal).select('-__v -updatedAt -createdAt');

            return res.status(200).json(ApiResponse.success('Meal created successfully', fetchedMeal))
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'));
        }
    }

    static async updateMeal(req, res) {
        const {id} = req.params;
        const {name, description, start_time, end_time} = req.body;

        if (!id)
            return res.status(400).json(ApiResponse.error('Meal id is required'));

        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json(ApiResponse.error('Invalid meal id'));

        try {
            const meal = await Meal.findById(id);

            if (!meal)
                return res.status(400).json(ApiResponse.error('Meal not found'));

            if (name) meal.name = name;
            if (description) meal.description = description;
            if (start_time) meal.start_time = getDate_24_HH_MM(start_time);
            if (end_time) meal.end_time = getDate_24_HH_MM(end_time);

            await meal.save();

            const updatedMeal = await Meal.findById(id).select('-__v -updatedAt -createdAt');

            return res.status(200).json(ApiResponse.success('Meal updated successfully', updatedMeal));

        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'));
        }

    }

    static async deleteMeal(req, res) {
        //TODO: Also check for other usage of this meal
        const {id} = req.params;
        if (!id)
            return res.status(400).json(ApiResponse.error('Meal id is required'));
       try{

           if (!mongoose.Types.ObjectId.isValid(id))
               return res.status(400).json(ApiResponse.error('Invalid meal id'));

           const isMealExist = await Meal.findById(id);
           if (!isMealExist)
               return res.status(400).json(ApiResponse.error('Meal not found'));

           const deletedMeal = await Meal.findByIdAndDelete(id).select('-__v -updatedAt -createdAt');
           return  res.status(200).json(ApiResponse.success('Meal deleted successfully', deletedMeal));


       }catch (e) {
           return res.status(500).json(ApiResponse.error(e.message || 'Internal server error'))

       }
    }
}

export default MealController;
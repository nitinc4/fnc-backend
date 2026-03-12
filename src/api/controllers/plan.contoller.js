import {Plan} from "../../models/plan/plan.model.js";
import ApiResponse from "../../utils/api_response.js";
import mongoose from "mongoose";
import {DietPlan} from "../../models/diet_plan/diet_plan.model.js";

class PlanController {

    static async get(req, res) {
        try {
            const plans = await Plan.find().select("-__v").populate({
                path: 'diet_plan',
                select: '-__v',
                strictPopulate: false,
                populate: {
                    path: 'breakfast morning_snacks lunch evening_snacks dinner created_by',
                    select: '-__v',
                    populate: {
                        path: 'food_id',
                        select: '-__v',
                    strictPopulate: false
                    },
                    strictPopulate: false
                }
            })
            return res.status(200).json(ApiResponse.success('Plans retrieved successfully', plans))
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error'))
        }
    }

    static async create(req, res) {

        try {

            const {name, description, price, duration, images, diet_plan} = req.body

            if (!name)
                return res.status(400).json(ApiResponse.error('Plan { name } is required'))
            if (!description)
                return res.status(400).json(ApiResponse.error('Plan { description } is required'))
            if (!price)
                return res.status(400).json(ApiResponse.error('Plan { price } is required'))
            if (!duration)
                return res.status(400).json(ApiResponse.error('Plan { duration } is required'))

            if (images) {
                if (!Array.isArray(images))
                    return res.status(400).json(ApiResponse.error('Plan { images } must be an array'))

            }

            if (!diet_plan) {
                return res.status(400).json(ApiResponse.error('Diet plan is required'))
            }

            if (diet_plan) {
                if (!mongoose.Types.ObjectId.isValid(diet_plan))
                    return res.status(400).json(ApiResponse.error('Invalid diet plan id'))
            }

            //get diet plan

            const dietPlan = await DietPlan.findById(diet_plan)

            if (!dietPlan)
                return res.status(400).json(ApiResponse.error('Diet plan not found'))

            console.log(images)

            const plan = await Plan.create({
                name,
                description,
                price,
                duration,
                images,
                diet_plan: dietPlan
            })

            return res.status(200).json(ApiResponse.success('Plan created successfully', plan))
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error'))
        }
    }


    static async getById(req, res) {
        try {
            const {id} = req.params
            if (mongoose.Types.ObjectId.isValid(id) === false)
                return res.status(400).json(ApiResponse.error('Invalid plan id'))

            const plan = await Plan.findById(id).select("-__v").populate({
                path: 'diet_plan',
                select: '-__v',
                strictPopulate: false,
                populate: {
                    path: 'breakfast morning_snacks lunch evening_snacks dinner created_by',
                    select: '-__v',
                    populate: {
                        path: 'food_id',
                        select: '-__v',
                        strictPopulate: false
                    },
                    strictPopulate: false
                }
            })
            if (!plan)
                return res.status(400).json(ApiResponse.error('Plan not found'))
            return res.status(200).json(ApiResponse.success('Plan retrieved successfully', plan))
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error'))
        }
    }

    static async update(req, res) {
        try {
            const {id} = req.params

            const {name, description, price, duration, images, diet_plan} = req.body

            if (mongoose.Types.ObjectId.isValid(id) === false)
                return res.status(400).json(ApiResponse.error('Invalid plan id'))


            const existingPlan = await Plan.findById(id)

            if (!existingPlan)
                return res.status(400).json(ApiResponse.error('Plan not found'))

            if (name)
                existingPlan.name = name
            if (description)
                existingPlan.description = description
            if (price)
                existingPlan.price = price
            if (duration)
                existingPlan.duration = duration

            if (images) {
                if (Array.isArray(images))
                    existingPlan.images = images
            }

            if (diet_plan) {
                if (!mongoose.Types.ObjectId.isValid(diet_plan))
                    return res.status(400).json(ApiResponse.error('Invalid diet plan id'))
                const dietPlan = await DietPlan.findById(diet_plan)
                if (!dietPlan)
                    return res.status(400).json(ApiResponse.error('Diet plan not found'))
                existingPlan.diet_plan = dietPlan
            }

            await existingPlan.save()

            const updatedPlan = await Plan.findById(id).select("-__v").populate({
                path: 'diet_plan',
                select: '-__v',
                strictPopulate: false,
                populate: {
                    path: 'breakfast morning_snacks lunch evening_snacks dinner created_by',
                    select: '-__v',
                    populate: {
                        path: 'food_id',
                        select: '-__v',
                        strictPopulate: false
                    },
                    strictPopulate: false
                }
            })

            if (!updatedPlan)
                return res.status(400).json(ApiResponse.error('Plan not found'))
            return res.status(200).json(ApiResponse.success('Plan updated successfully', updatedPlan))
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error'))
        }
    }

    static async delete(req, res) {
        try {
            const {id} = req.params

            if (mongoose.Types.ObjectId.isValid(id) === false)
                return res.status(400).json(ApiResponse.error('Invalid plan id'))


            const plan = await Plan.findByIdAndDelete(id)
            if (!plan)
                return res.status(400).json(ApiResponse.error('Plan not found'))
            return res.status(200).json(ApiResponse.success('Plan deleted successfully'))
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error'))
        }
    }
}

export default PlanController;
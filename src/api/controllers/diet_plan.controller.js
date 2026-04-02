import {DietPlan} from "../../models/diet_plan/diet_plan.model.js";
import ApiResponse from "../../utils/api_response.js";
import mongoose from "mongoose";

class DietPlanController {

    static async getDietPlans(req, res) {
        try {
            const {health_issues, variant, dietary_option} = req.query;
            let filter = {};
            if (health_issues) filter.health_issues = { $in: health_issues.split(',') };
            if (variant) filter.variant = variant.toLowerCase();
            // Dietary option is now optional since plans are being unified
            if (dietary_option && dietary_option !== 'all') filter.dietary_option = dietary_option;

            const dietPlans = await DietPlan.find(filter)
                .populate('health_issues')
                .populate('breakfast.food_id')
                .populate('lunch.food_id')
                .populate('dinner.food_id');
            return res.status(200).json(ApiResponse.success('Diet plans retrieved successfully', dietPlans));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message));
        }
    }

    static async getDietPlan(req, res) {
        try {
            const {id} = req.params;
            if (!mongoose.Types.ObjectId.isValid(id))
                return res.status(400).json(ApiResponse.error('Invalid ID format'));

            const dietPlan = await DietPlan.findById(id)
                .populate('health_issues')
                .populate('breakfast.food_id')
                .populate('lunch.food_id')
                .populate('dinner.food_id');
            if (!dietPlan) return res.status(404).json(ApiResponse.error('Diet plan not found'));
            return res.status(200).json(ApiResponse.success('Diet plan retrieved successfully', dietPlan));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message));
        }
    }

    static async createDietPlan(req, res) {
        try {
            const dietPlan = await DietPlan.create(req.body);
            return res.status(201).json(ApiResponse.success('Diet plan created successfully', dietPlan));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message));
        }
    }

    static async updateDietPlan(req, res) {
        try {
            const {id} = req.params;
            if (!mongoose.Types.ObjectId.isValid(id))
                return res.status(400).json(ApiResponse.error('Invalid ID format'));

            const dietPlan = await DietPlan.findByIdAndUpdate(id, req.body, {new: true});
            if (!dietPlan) return res.status(404).json(ApiResponse.error('Diet plan not found'));
            return res.status(200).json(ApiResponse.success('Diet plan updated successfully', dietPlan));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message));
        }
    }

    static async deleteDietPlan(req, res) {
        try {
            const {id} = req.params;
            if (!mongoose.Types.ObjectId.isValid(id))
                return res.status(400).json(ApiResponse.error('Invalid ID format'));

            const dietPlan = await DietPlan.findByIdAndDelete(id);
            if (!dietPlan) return res.status(404).json(ApiResponse.error('Diet plan not found'));
            return res.status(200).json(ApiResponse.success('Diet plan deleted successfully'));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message));
        }
    }
}

export default DietPlanController;

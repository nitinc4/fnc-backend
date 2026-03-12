import {DailyWeight} from "../../models/daily_weight/daily_weight.model.js";
import {User} from "../../models/auth/user.model.js";
import {getTodayByDate} from "../../utils/date_time_utils.js";
import ApiResponse from "../../utils/api_response.js";
import {UserProfile} from "../../models/profile/user_profile.model.js";

class DailyWeightController {


    static async getWeightData(req, res) {
        const {date} = req.query;
        const {user_id} = req.body;
        try {

            let latestWeight;
            if (date !== null && date !== undefined && date !== "" && date !== 'null') {
                const targetDate = getTodayByDate(date);
                latestWeight = await DailyWeight.find({
                    user_id: user_id,
                    createdAt: {
                        $gte: targetDate,
                        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
                    }
                }).sort({createdAt:-1}).limit(1).select(" -updatedAt -__v");

            } else {
                latestWeight = await DailyWeight.find({
                    user_id: user_id,
                }).sort({createdAt:-1}).limit(1).select(" -updatedAt -__v");

            }

            const user = await UserProfile.findOne({user_id: user_id}).select("  -updatedAt -__v");
            if (!user) {
                return res.status(404).json(ApiResponse.error("User not found"));
            }
            const userTargetWeight = user.target_weight;
            const userWeight = user.weight;

            let latestEntry
            if (latestWeight && latestWeight.length !== 0) {
                latestEntry = latestWeight[0];
            }

            const response = {
                my_weight: latestEntry ? latestEntry.weight : userWeight,
                target_weight: userTargetWeight,
                date: latestEntry ? latestEntry.createdAt : null
            }

            return res.status(200).json(ApiResponse.success("Daily weight fetched successfully", response))
        } catch (error) {
            return res.status(400).json(ApiResponse.error(error.message));
        }
    }

    static async getWeightDataOfDateRange(req, res) {
        const {start_date, end_date,limit ,page} = req.query;
        const {user_id} = req.body;


        const limitItem = limit ? parseInt(limit) : 10;
        const pageNumber = page ? parseInt(page) : 1;


        try {
            if (!start_date || !end_date) {
                return res.status(400).json(ApiResponse.error("start_date and end_date are required"));
            }

            const start = getTodayByDate(start_date);
            const end = getTodayByDate(end_date);

            const latestWeight = await DailyWeight.find({
                user_id: user_id,
                createdAt: {
                    $gte: start,
                    $lt: new Date(end.getTime() + 24 * 60 * 60 * 1000)
                }
            }).sort({createdAt:-1}).select(" -updatedAt -__v").limit(limitItem).skip((pageNumber - 1) * limitItem);

            const user = await UserProfile.findOne({user_id: user_id}).select(" -createdAt -updatedAt -__v");
            if (!user) {
                return res.status(400).json(ApiResponse.error("User not found"));
            }
            const userTargetWeight = user.target_weight;

            if (!latestWeight || latestWeight.length === 0) {
                return res.status(200).json(ApiResponse.success("No data found", []));
            }

            let weightList = []

            latestWeight.forEach((weight) => {
                weightList.push({
                    target_weight: userTargetWeight,
                    my_weight: weight.weight,
                    date: weight.createdAt
                })
            })

            return res.status(200).json(ApiResponse.success("Daily weight fetched successfully", weightList))
        } catch (error) {
            return res.status(400).json(ApiResponse.error(error.message));
        }
    }

    static async createDailyWeight(req, res) {

        try {

            const {user_id, weight} = req.body;

            if (!weight) {
                return res.status(400).json(ApiResponse.error("{ weight } is required"));
            }

            if (!user_id) {
                return res.status(400).json(ApiResponse.error("User id is required"));
            }

            const user = await User.findById(user_id);
            if (!user) {
                return res.status(404).json(ApiResponse.error("User not found"));
            }

            const dailyWeight = await DailyWeight.create({
                user_id: user_id,
                weight,
            });
            if (!dailyWeight) {
                return res.status(400).json(ApiResponse.error("Unable to save daily weight"));
            }

            const user_profile = await UserProfile.findOne({user_id: user_id});
            if (!user_profile) {
                return res.status(400).json(ApiResponse.error("User profile not found"));
            }

            const response = {
                my_weight:  dailyWeight.weight,
                target_weight: user_profile.target_weight,
                date: dailyWeight.createdAt
            }
            return res.status(200).json(ApiResponse.success("Daily weight saved successfully", response));
        } catch (error) {
            return res.status(400).json(ApiResponse.error(error.message));
        }
    }

    static async updateDailyWeight(req, res) {

        const id = req.params.id;
        const {weight} = req.body;
        if (!id)
            return res.status(400).json(ApiResponse.error("Daily weight id is required"));

        try {
            const dailyWeight = await DailyWeight.findByIdAndUpdate(id, {
                weight
            });
            if (!dailyWeight) {
                return res.status(400).json(ApiResponse.error("Unable to update daily weight"));
            }
            const user_profile = await UserProfile.findOne({user_id: dailyWeight.user_id});
            if (user_profile) {
                user_profile.weight = weight;
                await user_profile.save();
            }

            const userTargetWeight = user_profile.target_weight;
            const userWeight = user_profile.weight;

            const response = {
                my_weight: dailyWeight ? dailyWeight.weight : userWeight,
                target_weight: userTargetWeight,
                date: dailyWeight.createdAt
            }
            return res.status(200).json(ApiResponse.success("Daily weight updated successfully", response));
        } catch (error) {
            return res.status(400).json(ApiResponse.error(error.message));
        }
    }

    static async deleteDailyWeight(req, res) {
        const id = req.params.id;
        if (!id)
            return res.status(400).json(ApiResponse.error("Daily weight id is required"));

        try {
            const dailyWeight = await DailyWeight.findByIdAndDelete(id);
            if (!dailyWeight) {
                return res.status(400).json(ApiResponse.error("Daily weight not found"));
            }
            return res.status(200).json(ApiResponse.success("Daily weight deleted successfully", dailyWeight));
        } catch (error) {
            return res.status(400).json(ApiResponse.error(error.message));
        }
    }
}

export default DailyWeightController;
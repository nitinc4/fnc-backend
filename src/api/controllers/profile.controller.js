import ApiResponse from "../../utils/api_response.js";
import {UserProfile} from "../../models/profile/user_profile.model.js";
import {HealthIssue} from "../../models/health_issue/health_issue.model.js";
import {User} from "../../models/auth/user.model.js";
import mongoose from "mongoose";
import {DietPlan} from "../../models/diet_plan/diet_plan.model.js";

async function getDietPlans(healthIssues, user) {
    let dietPlans = []
    
    // Determine if the user has a paid plan
    const isPaidPlan = user && user.plan && user.plan.toLowerCase() !== 'free';
    
    if (isPaidPlan && healthIssues && healthIssues.length > 0) {
        const issueIds = healthIssues.map(issue => issue._id || issue);
        const matchingPlans = await DietPlan.find({
            health_issues: { $in: issueIds }
        });
        dietPlans = [...matchingPlans];
    }

    if (dietPlans.length === 0) {
        const plan = await DietPlan.findOne({name: { $regex: /general/i }});
        if (plan) dietPlans.push(plan)
    }
    return dietPlans;
}

class ProfileController {

    static async getProfile(req, res) {
        const {user_id} = req.body;
        try {
            const existingUserProfile = await UserProfile.findOne({user_id}).select('-__v')
                .populate('health_issues', '-__v')
                .populate({
                    path: 'diet_plans',
                    select: '-__v',
                    populate: { path: 'created_by', select: 'name email _id image_url' }
                }).populate({
                    path: 'diet_plans',
                    select: '-__v',
                    populate: {
                        path: 'breakfast morning_snacks lunch evening_snacks dinner',
                        select: '-__v',
                        populate: { path: 'food_id', select: '-__v' }
                    }
                }).lean(); // Use lean to allow formatting before sending

            if (!existingUserProfile) {
                return res.status(400).json(ApiResponse.error('Profile does not exist,try creating it'))
            }

            // GUARANTEE user_id is a String so Flutter doesn't crash
            if (existingUserProfile.user_id && typeof existingUserProfile.user_id === 'object') {
                existingUserProfile.user_id = existingUserProfile.user_id._id ? existingUserProfile.user_id._id.toString() : existingUserProfile.user_id.toString();
            } else if (existingUserProfile.user_id) {
                existingUserProfile.user_id = existingUserProfile.user_id.toString();
            }

            return res.status(200).json(ApiResponse.success('User found successfully', existingUserProfile))
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal Server Error'))
        }
    }

    static async createProfile(req, res) {
        const {
            user_id, name, weight, target_weight, height, gender, age, goal, 
            activity_level, city, state, country, diet_plans, health_issues,
        } = req.body

        if (!user_id) return res.status(400).json(ApiResponse.error('User is required'))
        if (!weight) return res.status(400).json(ApiResponse.error('{ weight } is required'))
        if (!target_weight) return res.status(400).json(ApiResponse.error('{ targeted_weight } is required'))
        if (!height) return res.status(400).json(ApiResponse.error('{ height } is required'))
        if (!gender) return res.status(400).json(ApiResponse.error('{ gender } is required'))
        if (!age) return res.status(400).json(ApiResponse.error('{ age } is required'))
        if (!goal) return res.status(400).json(ApiResponse.error('{ goal } is required'))
        if (!activity_level) return res.status(400).json(ApiResponse.error('{ activity_level } is required'))
        if (!city) return res.status(400).json(ApiResponse.error('{ city } is required'))
        if (!state) return res.status(400).json(ApiResponse.error('{ state } is required'))
        if (!country) return res.status(400).json(ApiResponse.error('{ country } is required'))
        if (!diet_plans) return res.status(400).json(ApiResponse.error('{ diet_plans } is required'))
        if (!Array.isArray(diet_plans)) return res.status(400).json(ApiResponse.error('{ diet_plans } must be an array'))
        if (!health_issues) return res.status(400).json(ApiResponse.error('{ health_issues } is required'))
        if (!Array.isArray(health_issues)) return res.status(400).json(ApiResponse.error('{ health_issues } must be an array'))

        try {
            const existingUserProfile = await UserProfile.findOne({user_id})
            if (existingUserProfile) {
                return await ProfileController.updateProfile(req, res);
            }

            const user = await User.findById(user_id)
            if (!user) return res.status(400).json(ApiResponse.error('User does not exist'))

            if (name) user.name = name
            await user.save()

            let healthIssueIds = []
            for (let issue of health_issues) {
                if (mongoose.Types.ObjectId.isValid(issue) === false)
                    return res.status(400).json(ApiResponse.error('Invalid Health Issue Id'))
                const healthIssue = await HealthIssue.findById(issue)
                if (!healthIssue) return res.status(400).json(ApiResponse.error('Health Issue does not exist'))
                
                healthIssueIds.push(healthIssue._id) // Only save IDs to DB
            }

            const assignedDietPlans = await getDietPlans(healthIssueIds, user)
            const dietPlanIds = assignedDietPlans.map(dp => dp._id);

            // Create profile
            const createdUser = await UserProfile.create({
                user_id: user._id, // Guarantee we save an ID, not an Object
                weight, target_weight, height, age, gender, goal, activity_level, 
                city, state, country, 
                health_issues: healthIssueIds,
                diet_plans: dietPlanIds
            })

            if (!createdUser) return res.status(400).json(ApiResponse.error('Error creating profile'))

            if (user.status_id < 1) {
                const isStatusUpdated = await User.findByIdAndUpdate(user_id, {status_id: 1})
                if (!isStatusUpdated) {
                    await UserProfile.findByIdAndDelete(createdUser._id)
                    return res.status(400).json(ApiResponse.error('Error updating user status  '))
                }
            }

            const updatedUser = await User.findById(user_id)

            // Deep populate to prevent Flutter from crashing due to missing Object layers
            let createdUserProfile = await UserProfile.findById(createdUser._id).select('-__v')
                .populate('health_issues', '-__v')
                .populate({
                    path: 'diet_plans',
                    select: '-__v',
                    populate: { path: 'created_by', select: 'name email _id image_url' }
                }).populate({
                    path: 'diet_plans',
                    select: '-__v',
                    populate: {
                        path: 'breakfast morning_snacks lunch evening_snacks dinner',
                        select: '-__v',
                        populate: { path: 'food_id', select: '-__v' }
                    }
                }).lean();

            if (user.status_id < 1) {
                user.status_id = 1
                await user.save()
            }

            createdUserProfile.name = updatedUser.name
            
            // GUARANTEE user_id is a String so Flutter doesn't crash
            if (createdUserProfile.user_id && typeof createdUserProfile.user_id === 'object') {
                createdUserProfile.user_id = createdUserProfile.user_id._id ? createdUserProfile.user_id._id.toString() : createdUserProfile.user_id.toString();
            } else if (createdUserProfile.user_id) {
                createdUserProfile.user_id = createdUserProfile.user_id.toString();
            }

            return res.status(200).json(ApiResponse.success('User profile created successfully', createdUserProfile))

        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal Server Error'))
        }
    }


    static async updateProfile(req, res) {
        console.log(req.body);

        const {
            user_id, name, weight, target_weight, height, gender, age, goal, 
            activity_level, city, state, country, health_issues, diet_plans,
        } = req.body

        if (!user_id) return res.status(400).json(ApiResponse.error('User is required'))
        
        try {
            const existingUserProfile = await UserProfile.findOne({user_id})
            if (!existingUserProfile) return res.status(400).json(ApiResponse.error('Profile does not exist,try creating it'))

            const user = await User.findById(user_id)
            if (!user) return res.status(400).json(ApiResponse.error('User does not exist'))

            if (name) user.name = name
            await user.save()

            if (weight) existingUserProfile.weight = weight
            if (target_weight) existingUserProfile.target_weight = target_weight
            if (height) existingUserProfile.height = height
            if (gender) existingUserProfile.gender = gender
            if (age) existingUserProfile.age = age
            if (goal) existingUserProfile.goal = goal
            if (activity_level) existingUserProfile.activity_level = activity_level
            if (city) existingUserProfile.city = city
            if (state) existingUserProfile.state = state
            if (country) existingUserProfile.country = country

            if (health_issues) {
                if (!Array.isArray(health_issues)) return res.status(400).json(ApiResponse.error('{ health_issues } must be an array'))
                let healthIssuesList = []
                for (let issue of health_issues) {
                    if (mongoose.Types.ObjectId.isValid(issue) === false) return res.status(400).json(ApiResponse.error('Invalid Health Issue Id'))
                    const healthIssue = await HealthIssue.findById(issue)
                    if (!healthIssue) return res.status(400).json(ApiResponse.error('Health Issue does not exist'))
                    healthIssuesList.push(healthIssue._id)
                }
                existingUserProfile.health_issues = healthIssuesList
            }

            if (diet_plans) {
                if (!Array.isArray(diet_plans)) return res.status(400).json(ApiResponse.error('{ diet_plans } must be an array'))

                if (diet_plans.length > 0) {
                    let dietPlanList = []
                    for (let plan of diet_plans) {
                        if (mongoose.Types.ObjectId.isValid(plan) === false) return res.status(400).json(ApiResponse.error('Invalid Diet Plan Id'))
                        const dietPlan = await DietPlan.findById(plan)
                        if (!dietPlan) return res.status(400).json(ApiResponse.error('Diet Plan does not exist'))
                        dietPlanList.push(dietPlan._id)
                    }
                    existingUserProfile.diet_plans = dietPlanList
                } else {
                    const resolvedPlans = await getDietPlans(existingUserProfile.health_issues, user)
                    existingUserProfile.diet_plans = resolvedPlans.map(p => p._id)
                }
            } else {
                const resolvedPlans = await getDietPlans(existingUserProfile.health_issues, user)
                existingUserProfile.diet_plans = resolvedPlans.map(p => p._id)
            }

            await existingUserProfile.save()

            // Deep populate to prevent Flutter from crashing due to missing Object layers
            let updatedProfile = await UserProfile.findById(existingUserProfile._id).select('-__v')
                .populate('health_issues', '-__v')
                .populate({
                    path: 'diet_plans',
                    select: '-__v',
                    populate: { path: 'created_by', select: 'name email _id image_url' }
                }).populate({
                    path: 'diet_plans',
                    select: '-__v',
                    populate: {
                        path: 'breakfast morning_snacks lunch evening_snacks dinner',
                        select: '-__v',
                        populate: { path: 'food_id', select: '-__v' }
                    }
                }).lean();

            let updatedUser = await User.findById(user_id)
            updatedProfile.name = updatedUser.name

            if (updatedUser.status_id < 1) {
                updatedUser.status_id = 1
                await updatedUser.save()
            }

            // GUARANTEE user_id is a String so Flutter doesn't crash
            if (updatedProfile.user_id && typeof updatedProfile.user_id === 'object') {
                updatedProfile.user_id = updatedProfile.user_id._id ? updatedProfile.user_id._id.toString() : updatedProfile.user_id.toString();
            } else if (updatedProfile.user_id) {
                updatedProfile.user_id = updatedProfile.user_id.toString();
            }

            return res.status(200).json(ApiResponse.success('Profile Updated successfully', updatedProfile))

        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal Server Error'))
        }
    }

    static async deleteProfile(req, res) {
        const {user_id} = req.body;
        if (!user_id) return res.status(400).json(ApiResponse.error('User is required'))

        try {
            const existingProfile = await UserProfile.findOne({user_id})
            if (!existingProfile) return res.status(400).json(ApiResponse.error('Profile does not exist'))

            const deletedProfile = await UserProfile.findByIdAndDelete(existingProfile._id)
            if (!deletedProfile) return res.status(400).json(ApiResponse.error('Error deleting profile'))

            const isUpdated = await User.findByIdAndUpdate(user_id, {status_id: 0})
            if (!isUpdated) return res.status(400).json(ApiResponse.error('Profile Deleted and Error updating user status'))

            return res.status(200).json(ApiResponse.success('Profile deleted successfully'))

        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal Server Error'))
        }
    }
}

export default ProfileController;
import ApiResponse from "../../utils/api_response.js";
import {UserProfile} from "../../models/profile/user_profile.model.js";
import {HealthIssue} from "../../models/health_issue/health_issue.model.js";
import {User} from "../../models/auth/user.model.js";
import mongoose from "mongoose";
import {DietPlan} from "../../models/diet_plan/diet_plan.model.js";

async function resolveDietPlans(healthIssueIds, requestedDietPlanIds, user) {
    // Determine if the user has a paid plan
    const isPaidPlan = user && user.plan && user.plan.toLowerCase() === 'paid';

    let finalPlanIds = [];

    // 1. If Paid Plan, assign specific plans
    if (isPaidPlan) {
        // A. If the frontend already knows and requested a specific plan, validate and use it
        if (requestedDietPlanIds && requestedDietPlanIds.length > 0) {
            const validPlans = await DietPlan.find({ _id: { $in: requestedDietPlanIds } });
            finalPlanIds = validPlans.map(p => p._id);
        }

        // B. If no plans were explicitly requested, auto-calculate based on health issues
        if (finalPlanIds.length === 0 && healthIssueIds && healthIssueIds.length > 0) {
            // Strictly enforce ObjectIds so Mongoose $in query never fails during creation
            const issueObjectIds = healthIssueIds.map(id => new mongoose.Types.ObjectId(id.toString()));
            const matchingPlans = await DietPlan.find({ health_issues: { $in: issueObjectIds } });
            finalPlanIds = matchingPlans.map(p => p._id);
        }
    }

    // 2. Fallback & Free Plan Enforcer: Assign General Plan if Free OR if Paid but no specific plans exist
    if (finalPlanIds.length === 0) {
        const generalPlan = await DietPlan.findOne({name: { $regex: /general/i }});
        if (generalPlan) {
            finalPlanIds.push(generalPlan._id);
        } else {
            console.log('No general diet plan found in the database');
        }
    }

    return finalPlanIds;
}

class ProfileController {

    static async getProfile(req, res) {
        const {user_id} = req.body;
        try {
            //check if user profile exist
            const existingUserProfile = await UserProfile.findOne({user_id}).select('-__v').populate('health_issues', '-__v').populate({
                path: 'diet_plans',
                select: '-__v',
                populate: {
                    path: 'created_by',
                    select: 'name email _id image_url',
                }
            }).populate({
                path: 'diet_plans',
                select: '-__v',
                populate: {
                    path: 'breakfast morning_snacks lunch evening_snacks dinner',
                    select: '-__v',
                    populate: {
                        path: 'food_id',
                        select: '-__v',
                    }
                }
            })

            if (!existingUserProfile) {
                return res.status(400).json(ApiResponse.error('Profile does not exist,try creating it'))
            }
            return res.status(200).json(ApiResponse.success('User found successfully', existingUserProfile))

        } catch (e) {

            return res.status(500).json(ApiResponse.error(e.message || 'Internal Server Error'))
        }
    }

    static async createProfile(req, res) {

        const {
            user_id, name, weight, target_weight, height, gender, age, goal, activity_level, 
            city, state, country, diet_plans, health_issues,
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
            //check if user profile exist
            const existingUserProfile = await UserProfile.findOne({user_id})

            if (existingUserProfile) {
                return await ProfileController.updateProfile(req, res);
            }

            //get user
            const user = await User.findById(user_id)

            if (!user) return res.status(400).json(ApiResponse.error('User does not exist'))

            if (name) user.name = name

            await user.save()

            //get health issues explicitly extracted as ObjectIds
            let healthIssuesList = []
            for (let issue of health_issues) {
                if (mongoose.Types.ObjectId.isValid(issue) === false)
                    return res.status(400).json(ApiResponse.error('Invalid Health Issue Id'))
                const healthIssue = await HealthIssue.findById(issue)
                if (!healthIssue)
                    return res.status(400).json(ApiResponse.error('Health Issue does not exist'))
                healthIssuesList.push(healthIssue._id)
            }

            // Pass resolved IDs and user down to safely evaluate assignment rules
            const finalDietPlanIds = await resolveDietPlans(healthIssuesList, diet_plans, user);

            //create user profile
            const createdUser = await UserProfile.create({
                user_id: user._id,
                weight,
                target_weight: target_weight,
                height,
                age: age,
                gender,
                goal,
                activity_level,
                city,
                state,
                country,
                health_issues: healthIssuesList,
                diet_plans: finalDietPlanIds
            })

            if (!createdUser) {
                return res.status(400).json(ApiResponse.error('Error creating profile'))
            }

            //update user status to 1
            if (user.status_id < 1) {
                const isStatusUpdated = await User.findByIdAndUpdate(user_id, {status_id: 1})

                if (!isStatusUpdated) {
                    await UserProfile.findByIdAndDelete(createdUser._id)
                    return res.status(400).json(ApiResponse.error('Error updating user status  '))
                }
            }

            const updatedUser = await User.findById(user_id)

            // Shallow populate consistent with frontend expectations
            let createdUserProfile = await UserProfile.findById(createdUser._id).select('-__v')
                .populate('health_issues', '-__v')
                .populate('diet_plans', '-__v');

            if (user.status_id < 1) {
                user.status_id = 1
                await user.save()
            }

            createdUserProfile._doc.name = updatedUser.name

            return res.status(200).json(ApiResponse.success('User profile created successfully', createdUserProfile))

        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal Server Error'))
        }
    }


    static async updateProfile(req, res) {

        console.log(req.body);

        const {
            user_id, name, weight, target_weight, height, gender, age, goal, activity_level,
            city, state, country, health_issues, diet_plans,
        } = req.body

        if (!user_id) return res.status(400).json(ApiResponse.error('User is required'))

        try {
            //check if user profile exist
            const existingUserProfile = await UserProfile.findOne({user_id})

            if (!existingUserProfile) {
                return res.status(400).json(ApiResponse.error('Profile does not exist,try creating it'))
            }

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
                    if (mongoose.Types.ObjectId.isValid(issue) === false)
                        return res.status(400).json(ApiResponse.error('Invalid Health Issue Id'))
                    const healthIssue = await HealthIssue.findById(issue)
                    if (!healthIssue)
                        return res.status(400).json(ApiResponse.error('Health Issue does not exist'))
                    healthIssuesList.push(healthIssue._id)
                }
                existingUserProfile.health_issues = healthIssuesList
            }

            // Safely resolve the final diet plan by filtering through the rules
            const requestedPlans = diet_plans && Array.isArray(diet_plans) ? diet_plans : [];
            existingUserProfile.diet_plans = await resolveDietPlans(existingUserProfile.health_issues, requestedPlans, user);

            await existingUserProfile.save()

            // Shallow populate consistent with frontend expectations
            let updatedProfile = await UserProfile.findById(existingUserProfile._id).select('-__v')
                .populate('health_issues', '-__v')
                .populate('diet_plans', '-__v');

            let updatedUser = await User.findById(user_id)
            updatedProfile._doc.name = updatedUser.name

            if (updatedUser.status_id < 1) {
                updatedUser.status_id = 1
                await updatedUser.save()
            }

            return res.status(200).json(ApiResponse.success('Profile Updated successfully', updatedProfile))

        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal Server Error'))
        }
    }

    static async deleteProfile(req, res) {
        //step 1: check if profile exist
        //step 2: delete profile
        //step 3: update statusId to 1

        const {user_id} = req.body;
        if (!user_id) {
            return res.status(400).json(ApiResponse.error('User is required'))
        }

        try {
            //check if profile exist
            const existingProfile = await UserProfile.findOne({user_id})

            if (!existingProfile) {
                return res.status(400).json(ApiResponse.error('Profile does not exist'))
            }

            //delete profile
            const deletedProfile = await UserProfile.findByIdAndDelete(existingProfile._id)
            if (!deletedProfile) {
                return res.status(400).json(ApiResponse.error('Error deleting profile'))
            }

            //update user status to 0
            const isUpdated = await User.findByIdAndUpdate(user_id, {status_id: 0})

            if (!isUpdated) {
                return res.status(400).json(ApiResponse.error('Profile Deleted and Error updating user status'))
            }

            return res.status(200).json(ApiResponse.success('Profile deleted successfully'))

        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message || 'Internal Server Error'))
        }
    }
}

export default ProfileController;
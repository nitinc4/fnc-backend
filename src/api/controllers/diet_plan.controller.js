import ApiResponse from "../../utils/api_response.js";
import {UserProfile} from "../../models/profile/user_profile.model.js";
import {HealthIssue} from "../../models/health_issue/health_issue.model.js";
import {User} from "../../models/auth/user.model.js";
import mongoose from "mongoose";
import {DietPlan} from "../../models/diet_plan/diet_plan.model.js";

// UPDATED HELPER FUNCTION
async function getDietPlans(healthIssues) {
    let dietPlans = [];

    if (healthIssues && healthIssues.length > 0) {
        // Extract the ObjectIds from the healthIssues array
        const issueIds = healthIssues.map(issue => issue._id || issue);

        // Find diet plans that have AT LEAST ONE of the user's selected health issues
        const matchingPlans = await DietPlan.find({
            health_issues: { $in: issueIds }
        });

        dietPlans = [...matchingPlans];
    }

    // Fallback: If no specific diet plans exist for the selected health issues 
    // (or if the user selected no health issues), add the general diet plan.
    if (dietPlans.length === 0) {
        // Find a general plan (using regex to ignore case)
        const plan = await DietPlan.findOne({ name: { $regex: /general/i } });
        if (plan) {
            dietPlans.push(plan);
        } else {
            console.log('No general diet plan found in the database');
        }
    }

    return dietPlans;
}

class ProfileController {

    static async getProfile(req, res) {
        const {user_id} = req.body;
        try {
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

            // Process health issues
            let healthIssues = []
            for (let issue of health_issues) {
                if (mongoose.Types.ObjectId.isValid(issue) === false)
                    return res.status(400).json(ApiResponse.error('Invalid Health Issue Id'))
                const healthIssue = await HealthIssue.findById(issue)
                if (!healthIssue)
                    return res.status(400).json(ApiResponse.error('Health Issue does not exist'))
                healthIssues.push(healthIssue)
            }

            // AUTO-LINK DIET PLANS BASED ON HEALTH ISSUES
            const computedDietPlans = await getDietPlans(healthIssues)

            //create user profile
            const createdUser = await UserProfile.create({
                user_id: user,
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
                health_issues: healthIssues,
                diet_plans: computedDietPlans // Attach generated linked diet plans
            })

            if (!createdUser) {
                return res.status(400).json(ApiResponse.error('Error creating profile'))
            }

            if (user.status_id < 1) {
                const isStatusUpdated = await User.findByIdAndUpdate(user_id, {status_id: 1})
                if (!isStatusUpdated) {
                    await UserProfile.findByIdAndDelete(createdUser._id)
                    return res.status(400).json(ApiResponse.error('Error updating user status'))
                }
            }

            const updatedUser = await User.findById(user_id)
            let createdUserProfile = await UserProfile.findById(createdUser._id)

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
        const {
            user_id, name, weight, target_weight, height, gender, age, goal, activity_level,
            city, state, country, health_issues, diet_plans,
        } = req.body

        if (!user_id) return res.status(400).json(ApiResponse.error('User is required'))
        
        try {
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

            // Track if health issues changed so we know whether to recalculate diet plans
            let healthIssuesChanged = false;

            if (health_issues) {
                if (!Array.isArray(health_issues))
                    return res.status(400).json(ApiResponse.error('{ health_issues } must be an array'))

                let healthIssuesList = []
                for (let issue of health_issues) {
                    if (mongoose.Types.ObjectId.isValid(issue) === false)
                        return res.status(400).json(ApiResponse.error('Invalid Health Issue Id'))
                    const healthIssue = await HealthIssue.findById(issue)
                    if (!healthIssue)
                        return res.status(400).json(ApiResponse.error('Health Issue does not exist'))
                    healthIssuesList.push(healthIssue)
                }
                existingUserProfile.health_issues = healthIssuesList
                healthIssuesChanged = true;
            }

            // DIET PLAN LOGIC FOR UPDATES
            // If the user manually passes an array of diet plans, use them.
            if (diet_plans && Array.isArray(diet_plans) && diet_plans.length > 0) {
                let dietPlanList = []
                for (let plan of diet_plans) {
                    if (mongoose.Types.ObjectId.isValid(plan) === false)
                        return res.status(400).json(ApiResponse.error('Invalid Diet Plan Id'))
                    const dietPlan = await DietPlan.findById(plan)
                    if (!dietPlan)
                        return res.status(400).json(ApiResponse.error('Diet Plan does not exist'))
                    dietPlanList.push(dietPlan)
                }
                existingUserProfile.diet_plans = dietPlanList
            } 
            // If the user's health issues changed OR they have no diet plan, automatically generate them
            else if (healthIssuesChanged || !existingUserProfile.diet_plans || existingUserProfile.diet_plans.length === 0) {
                existingUserProfile.diet_plans = await getDietPlans(existingUserProfile.health_issues);
            }

            await existingUserProfile.save()

            let updatedProfile = await UserProfile.findById(existingUserProfile._id).select('-__v')
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
        const {user_id} = req.body;
        if (!user_id) return res.status(400).json(ApiResponse.error('User is required'))

        try {
            const existingProfile = await UserProfile.findOne({user_id})

            if (!existingProfile) {
                return res.status(400).json(ApiResponse.error('Profile does not exist'))
            }

            const deletedProfile = await UserProfile.findByIdAndDelete(existingProfile._id)
            if (!deletedProfile) {
                return res.status(400).json(ApiResponse.error('Error deleting profile'))
            }

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
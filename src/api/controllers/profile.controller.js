import ApiResponse from "../../utils/api_response.js";
import {UserProfile} from "../../models/profile/user_profile.model.js";
import {HealthIssue} from "../../models/health_issue/health_issue.model.js";
import {User} from "../../models/auth/user.model.js";
import mongoose from "mongoose";
import {DietPlan} from "../../models/diet_plan/diet_plan.model.js";

// --- SAFTEY UTILS FOR FLUTTER ---
// Flutter strictly expects strings & numbers. If a UI dropdown sends a full object, 
// we must extract the primitive value to prevent Dart casting crashes.
const extractStr = (val) => {
    if (!val) return val;
    if (typeof val === 'object') return val.name || val.title || val.value || val.id || String(val);
    return String(val);
};

const extractNum = (val) => {
    if (val === undefined || val === null) return val;
    if (typeof val === 'object') return Number(val.value || val.amount || 0);
    return Number(val);
};

const extractId = (val) => {
    if (!val) return val;
    if (typeof val === 'object') return val._id || val.id || val;
    return val;
};

// Fixes already corrupted DB data on the fly before sending it back to Flutter
const sanitizeForFlutter = (profile) => {
    if (!profile) return profile;
    
    // Guarantee user_id is a String
    if (profile.user_id && typeof profile.user_id === 'object') {
        profile.user_id = profile.user_id._id ? profile.user_id._id.toString() : profile.user_id.toString();
    } else if (profile.user_id) {
        profile.user_id = profile.user_id.toString();
    }

    // Force string fields to be strings (Fixes Dropdown Objects)
    const stringFields = ['name', 'gender', 'goal', 'activity_level', 'city', 'state', 'country'];
    for (let field of stringFields) {
        if (profile[field] && typeof profile[field] === 'object') {
            profile[field] = profile[field].name || profile[field].value || profile[field].title || String(profile[field]);
        }
    }
    return profile;
};
// -------------------------------

async function resolveDietPlans(healthIssueIds, requestedDietPlanIds, user) {
    const isPaidPlan = user && user.plan && user.plan.toLowerCase() === 'paid';
    let finalPlanIds = [];

    if (isPaidPlan) {
        if (requestedDietPlanIds && requestedDietPlanIds.length > 0) {
            const cleanRequested = requestedDietPlanIds.map(extractId);
            const validPlans = await DietPlan.find({ _id: { $in: cleanRequested } });
            finalPlanIds = validPlans.map(p => p._id);
        }

        if (finalPlanIds.length === 0 && healthIssueIds && healthIssueIds.length > 0) {
            const cleanIssues = healthIssueIds.map(extractId);
            const matchingPlans = await DietPlan.find({ health_issues: { $in: cleanIssues } });
            finalPlanIds = matchingPlans.map(p => p._id);
        }
    }

    if (finalPlanIds.length === 0) {
        const generalPlan = await DietPlan.findOne({name: { $regex: /general/i }});
        if (generalPlan) finalPlanIds.push(generalPlan._id);
    }

    return finalPlanIds;
}

class ProfileController {

    static async getProfile(req, res) {
        const {user_id} = req.body;
        try {
            let existingUserProfile = await UserProfile.findOne({user_id}).select('-__v')
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

            if (!existingUserProfile) {
                return res.status(400).json(ApiResponse.error('Profile does not exist,try creating it'))
            }

            // Apply Flutter Safety Net
            existingUserProfile = sanitizeForFlutter(existingUserProfile);

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

            if (name) user.name = extractStr(name);
            await user.save()

            let healthIssuesList = []
            for (let issue of health_issues) {
                const issueId = extractId(issue); // Extract ID safely
                if (mongoose.Types.ObjectId.isValid(issueId) === false) continue;
                const healthIssue = await HealthIssue.findById(issueId)
                if (healthIssue) healthIssuesList.push(healthIssue._id)
            }

            const assignedDietPlanIds = await resolveDietPlans(healthIssuesList, diet_plans, user);

            const createdUser = await UserProfile.create({
                user_id: user._id, 
                weight: extractNum(weight), 
                target_weight: extractNum(target_weight), 
                height: extractNum(height), 
                age: extractNum(age), 
                gender: extractStr(gender), 
                goal: extractStr(goal), 
                activity_level: extractStr(activity_level), 
                city: extractStr(city), 
                state: extractStr(state), 
                country: extractStr(country), 
                health_issues: healthIssuesList,
                diet_plans: assignedDietPlanIds
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
            
            // Apply Flutter Safety Net
            createdUserProfile = sanitizeForFlutter(createdUserProfile);

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

            if (name) user.name = extractStr(name);
            await user.save()

            // Safely extract primitive values from objects to prevent Dart crashes
            if (weight) existingUserProfile.weight = extractNum(weight);
            if (target_weight) existingUserProfile.target_weight = extractNum(target_weight);
            if (height) existingUserProfile.height = extractNum(height);
            if (age) existingUserProfile.age = extractNum(age);
            
            if (gender) existingUserProfile.gender = extractStr(gender);
            if (goal) existingUserProfile.goal = extractStr(goal);
            if (activity_level) existingUserProfile.activity_level = extractStr(activity_level);
            if (city) existingUserProfile.city = extractStr(city);
            if (state) existingUserProfile.state = extractStr(state);
            if (country) existingUserProfile.country = extractStr(country);

            if (health_issues) {
                if (!Array.isArray(health_issues)) return res.status(400).json(ApiResponse.error('{ health_issues } must be an array'))
                let healthIssuesList = []
                for (let issue of health_issues) {
                    const issueId = extractId(issue);
                    if (mongoose.Types.ObjectId.isValid(issueId) === false) continue;
                    const healthIssue = await HealthIssue.findById(issueId)
                    if (healthIssue) healthIssuesList.push(healthIssue._id)
                }
                existingUserProfile.health_issues = healthIssuesList
            }

            const requestedPlans = diet_plans && Array.isArray(diet_plans) ? diet_plans : [];
            existingUserProfile.diet_plans = await resolveDietPlans(existingUserProfile.health_issues, requestedPlans, user);

            await existingUserProfile.save()

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

            // Apply Flutter Safety Net
            updatedProfile = sanitizeForFlutter(updatedProfile);

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
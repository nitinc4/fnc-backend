import ApiResponse from "../../utils/api_response.js";
import {UserProfile} from "../../models/profile/user_profile.model.js";
import {HealthIssue} from "../../models/health_issue/health_issue.model.js";
import {User} from "../../models/auth/user.model.js";
import mongoose from "mongoose";
import {DietPlan} from "../../models/diet_plan/diet_plan.model.js";

// --- SAFTEY UTILS FOR FLUTTER ---
// If the UI sends an object from a dropdown (e.g., {"id": "1", "name": "Male"}) 
// instead of a string ("Male"), these safely extract the string to prevent DB corruption.
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
    return String(val);
};

// --- CASE NORMALIZATION ---
const normalizeVariant = (val) => {
    if (!val) return val;
    const str = extractStr(val).toLowerCase();
    if (str === 'weight loss') return 'Weight Loss';
    if (str === 'weight gain') return 'Weight Gain';
    if (str === 'weight maintenance') return 'Weight Maintenance';
    return val;
};

// Robust Resolver for Health Issues (Handles IDs or Names)
async function resolveHealthIssuesList(inputList) {
    if (!inputList || !Array.isArray(inputList)) return [];
    let resolvedIds = [];
    for (let item of inputList) {
        const idOrName = extractId(item);
        if (!idOrName) continue;
        
        // Try ID Lookup
        if (mongoose.Types.ObjectId.isValid(idOrName)) {
            const issue = await HealthIssue.findById(idOrName);
            if (issue) {
                resolvedIds.push(issue._id);
                continue;
            }
        }

        // Try Name Lookup (Case-Insensitive)
        const issueByName = await HealthIssue.findOne({ name: { $regex: new RegExp(`^${idOrName}$`, 'i') } });
        if (issueByName) {
            resolvedIds.push(issueByName._id);
        }
    }
    return resolvedIds;
}
// -------------------------------

async function resolveDietPlans(healthIssueIds, requestedDietPlanIds, user, userProfileData = {}) {
    const isPaidPlan = user && user.plan && user.plan.toLowerCase() === 'paid';
    let finalPlanIds = [];

    const variant = userProfileData.variant || 'Weight Maintenance';

    // 1. Paid Users get specific plans
    if (isPaidPlan) {
        if (requestedDietPlanIds && requestedDietPlanIds.length > 0) {
            const cleanRequested = requestedDietPlanIds.map(extractId);
            const validPlans = await DietPlan.find({ _id: { $in: cleanRequested } });
            finalPlanIds = validPlans.map(p => p._id);
        }

        if (finalPlanIds.length === 0 && healthIssueIds && healthIssueIds.length > 0) {
            const cleanIssues = healthIssueIds.map(extractId);
            // Match by health issue AND variant (Unified plans contain all Veg/Non-Veg/Vegan options)
            const matchingPlans = await DietPlan.find({ 
                health_issues: { $in: cleanIssues },
                variant: variant
            });
            
            if (matchingPlans.length > 0) {
                finalPlanIds = matchingPlans.map(p => p._id);
            } else {
                // Fallback: match by health issue only
                const issueOnlyPlans = await DietPlan.find({ health_issues: { $in: cleanIssues } });
                finalPlanIds = issueOnlyPlans.map(p => p._id);
            }
        }
    }

    // 2. Free Users (or fallback) - try to find a variant-matched "General" plan
    if (finalPlanIds.length === 0) {
        const matchingPlan = await DietPlan.findOne({
            variant: variant,
            name: { $regex: /general/i }
        });
        if (matchingPlan) {
            finalPlanIds.push(matchingPlan._id);
        } else {
            // Ultimate fallback: Any general plan
            const generalPlan = await DietPlan.findOne({name: { $regex: /General/i }});
            if (generalPlan) finalPlanIds.push(generalPlan._id);
        }
    }

    return finalPlanIds;
}

class ProfileController {

    static async getProfile(req, res) {
        const {user_id} = req.body;
        try {
            // getProfile retains .populate() as the UI usually expects rich data on view
            let existingUserProfile = await UserProfile.findOne({user_id}).select('-__v')
                .populate('health_issues', '-__v')
                .populate({
                    path: 'diet_plans',
                    select: '-__v',
                    populate: { path: 'created_by', select: 'name email _id image_url' }
                }).populate({
                    path: 'diet_plans',
                    select: '-__v',
                    populate: [
                        { path: 'breakfast.veg.food_id' },
                        { path: 'breakfast.non_veg.food_id' },
                        { path: 'breakfast.vegan.food_id' },
                        { path: 'lunch.veg.food_id' },
                        { path: 'lunch.non_veg.food_id' },
                        { path: 'lunch.vegan.food_id' },
                        { path: 'dinner.veg.food_id' },
                        { path: 'dinner.non_veg.food_id' },
                        { path: 'dinner.vegan.food_id' }
                    ]
                }).lean(); 

            if (!existingUserProfile) {
                return res.status(400).json(ApiResponse.error('Profile does not exist,try creating it'))
            }

            // Ensure user_id is a plain string
            if (existingUserProfile.user_id) {
                existingUserProfile.user_id = existingUserProfile.user_id._id ? existingUserProfile.user_id._id.toString() : existingUserProfile.user_id.toString();
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

            if (name) user.name = extractStr(name);
            await user.save()

            let healthIssuesList = await resolveHealthIssuesList(health_issues);

            let calculatedVariant = normalizeVariant(req.body.variant) || 'Weight Maintenance';
            const curWeight = extractNum(weight);
            const targetWeight = extractNum(target_weight);
            if (curWeight && targetWeight) {
                if (curWeight > targetWeight + 0.5) calculatedVariant = 'Weight Loss';
                else if (curWeight < targetWeight - 0.5) calculatedVariant = 'Weight Gain';
                else calculatedVariant = 'Weight Maintenance';
            }

            const assignedDietPlanIds = await resolveDietPlans(healthIssuesList, diet_plans, user, {
                variant: calculatedVariant,
                dietary_option: extractStr(req.body.dietary_option)
            });

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
                variant: calculatedVariant,
                dietary_option: extractStr(req.body.dietary_option),
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
                user.status_id = 1;
                await user.save();
            }

            const updatedUser = await User.findById(user_id)

            // VERY IMPORTANT: Using .lean() and NO POPULATION here so Flutter receives pure arrays of String IDs
            let createdUserProfile = await UserProfile.findById(createdUser._id).select('-__v').lean();

            createdUserProfile.name = updatedUser.name;
            
            // GUARANTEE all IDs are strings to prevent Dart mapping crash
            createdUserProfile.user_id = createdUserProfile.user_id.toString();
            createdUserProfile.health_issues = (createdUserProfile.health_issues || []).map(id => id.toString());
            createdUserProfile.diet_plans = (createdUserProfile.diet_plans || []).map(id => id.toString());

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
            variant, dietary_option
        } = req.body

        if (!user_id) return res.status(400).json(ApiResponse.error('User is required'))
        
        try {
            const existingUserProfile = await UserProfile.findOne({user_id})
            if (!existingUserProfile) return res.status(400).json(ApiResponse.error('Profile does not exist,try creating it'))

            const user = await User.findById(user_id)
            if (!user) return res.status(400).json(ApiResponse.error('User does not exist'))

            if (name) user.name = extractStr(name);
            await user.save()

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
                existingUserProfile.health_issues = await resolveHealthIssuesList(health_issues);
            }

            if (variant) existingUserProfile.variant = normalizeVariant(variant);
            if (dietary_option) existingUserProfile.dietary_option = extractStr(dietary_option);
            if (req.body.has_social_discount !== undefined) {
                existingUserProfile.has_social_discount = req.body.has_social_discount;
            }

            let calculatedVariant = existingUserProfile.variant || 'Weight Maintenance';
            if (existingUserProfile.weight && existingUserProfile.target_weight) {
                if (existingUserProfile.weight > existingUserProfile.target_weight + 0.5) calculatedVariant = 'Weight Loss';
                else if (existingUserProfile.weight < existingUserProfile.target_weight - 0.5) calculatedVariant = 'Weight Gain';
                else calculatedVariant = 'Weight Maintenance';
            }
            existingUserProfile.variant = calculatedVariant;

            const requestedPlans = diet_plans && Array.isArray(diet_plans) ? diet_plans : [];
            existingUserProfile.diet_plans = await resolveDietPlans(existingUserProfile.health_issues, requestedPlans, user, {
                variant: existingUserProfile.variant,
                dietary_option: existingUserProfile.dietary_option
            });

            await existingUserProfile.save()

            let updatedUser = await User.findById(user_id)
            if (updatedUser.status_id < 1) {
                updatedUser.status_id = 1
                await updatedUser.save()
            }

            // VERY IMPORTANT: Using .lean() and NO POPULATION here so Flutter receives pure arrays of String IDs
            let updatedProfile = await UserProfile.findById(existingUserProfile._id).select('-__v').lean();
            updatedProfile.name = updatedUser.name;

            // GUARANTEE all IDs are strings to prevent Dart mapping crash
            updatedProfile.user_id = updatedProfile.user_id.toString();
            updatedProfile.health_issues = (updatedProfile.health_issues || []).map(id => id.toString());
            updatedProfile.diet_plans = (updatedProfile.diet_plans || []).map(id => id.toString());

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
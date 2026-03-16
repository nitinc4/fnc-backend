import { User } from "../../models/auth/user.model.js";
import ApiResponse from "../../utils/api_response.js";
import mongoose from "mongoose";
import { UserProfile } from "../../models/profile/user_profile.model.js";

class UserController {
    static async getAllUsers(req, res) {
        const { name } = req.query;
        try {
            let allUsers = [];
            let users = await User.find(
                name && name !== 'null' && name !== '' ? { name: { $regex: new RegExp(name, 'i') } } : {}
            ).select('-password -__v -createdAt -updatedAt -token');

            for (let user of users) {
                let diet_plan = null;
                let profile = null;
                if (user.status_id >= 1) {
                    let userProfile = await UserProfile.find({ 'user_id': user._id }).populate({
                        path: 'diet_plans health_issues',
                        select: '_id name description'
                    });
                    if (userProfile.length > 0) {
                        diet_plan = userProfile[0].diet_plans;
                        profile = userProfile[0]._doc;
                    }
                }
                allUsers.push({ ...user._doc, diet_plan: diet_plan, profile: profile });
            }
            return res.status(200).json(ApiResponse.success('Users retrieved successfully', allUsers));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error'));
        }
    }

    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json(ApiResponse.error('Invalid user id'));
            }
            const user = await User.findById(id).select('-password -__v -createdAt -updatedAt -token');
            if (!user) {
                return res.status(400).json(ApiResponse.error('User not found'));
            }
            let diet_plan = null;
            let profile = null;
            if (user.status_id >= 1) {
                let userProfile = await UserProfile.find({ 'user_id': user._id }).populate({
                    path: 'diet_plans health_issues',
                    select: '_id name description'
                });
                if (userProfile.length > 0) {
                    diet_plan = userProfile[0].diet_plans;
                    profile = userProfile[0]._doc;
                }
            }
            const userData = { ...user._doc, diet_plan: diet_plan, profile: profile };
            return res.status(200).json(ApiResponse.success('User retrieved successfully', userData));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error'));
        }
    }

    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { is_active, role, diet_plan, plan, trial_days } = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json(ApiResponse.error('Invalid user id'));
            }

            const user = await User.findById(id);
            if (!user) {
                return res.status(400).json(ApiResponse.error('User not found'));
            }

            // Update simple fields
            if (is_active !== undefined) user.is_active = is_active;
            if (role) user.role = role;

            // Plan and Trial logic with explicit Number casting
            if (plan) user.plan = plan;
            if (trial_days !== undefined) {
                const numDays = parseInt(trial_days);
                user.trial_days = isNaN(numDays) ? 0 : numDays;
            }

            // Diet plan logic
            if (diet_plan && mongoose.Types.ObjectId.isValid(diet_plan)) {
                let userProfile = await UserProfile.findOne({ 'user_id': user._id });
                if (userProfile) {
                    userProfile.diet_plan = [diet_plan];
                    await userProfile.save();
                }
            }

            await user.save();
            // Return updated user converted to plain JSON object
            return res.status(200).json(ApiResponse.success('User updated successfully', user.toObject()));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error'));
        }
    }

    static async updatePassword(req, res) {
        try {
            const { user_id, old_password, new_password } = req.body;
            if (!mongoose.Types.ObjectId.isValid(user_id)) {
                return res.status(400).json({ error: 'Invalid user id' });
            }
            const user = await User.findById(user_id);
            if (!user) return res.status(400).json(ApiResponse.error('User not found'));
            if (user.password !== old_password) return res.status(400).json(ApiResponse.error('Old password incorrect'));
            user.password = new_password;
            await user.save();
            return res.status(200).json(ApiResponse.success('Password updated successfully', true));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error'));
        }
    }

    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findByIdAndDelete(id);
            if (!user) return res.status(400).json(ApiResponse.error('User not found'));
            return res.status(200).json(ApiResponse.success('User deleted successfully', true));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error'));
        }
    }
}

export default UserController;
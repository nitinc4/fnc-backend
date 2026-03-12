import {User} from "../../models/auth/user.model.js";
import ApiResponse from "../../utils/api_response.js";
import mongoose from "mongoose";
import {UserProfile} from "../../models/profile/user_profile.model.js";

class UserController {

    static async getAllUsers(req, res) {

        const {name} = req.query;

        try {

            //fetch all users from the database

            let allUsers = []

            let users = await User.find(
                name && name !== 'null' && name !== '' ? {name: {$regex: new RegExp(name, 'i')}} : {}
            ).select('-password -__v -createdAt -updatedAt -token');

            //get diet plan from user profile
            for (let user of users) {
                let diet_plan = null;
                let profile = null
                if (user.status_id >= 1) {

                    let userProfile = await UserProfile.find({'user_id': user._id}).populate({
                        path: 'diet_plans health_issues',
                        select: '_id name description'
                    });
                    if (userProfile.length > 0) {
                        diet_plan = userProfile[0].diet_plans;
                        profile = userProfile[0]._doc;
                    }
                }
                allUsers.push({...user._doc, diet_plan: diet_plan, profile: profile});
            }

            return res.status(200).json(ApiResponse.success('Users retrieved successfully', allUsers));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error'));
        }
    }

    static async getUserById(req, res) {
        try {
            const {id} = req.params;
            if (mongoose.Types.ObjectId.isValid(id) === false) {
                return res.status(400).json(ApiResponse.error('Invalid user id'));
            }

            let userData = {}

            const user = await User.findById(id).select('-password -__v -createdAt -updatedAt -token')
            if (!user) {
                return res.status(400).json(ApiResponse.error('User not found'));
            }

            let diet_plan = null;
            let profile = null
            if (user.status_id >= 1) {
                let userProfile = await UserProfile.find({'user_id': user._id}).populate({
                    path: 'diet_plans health_issues',
                    select: '_id name description'
                });
                if (userProfile.length > 0) {
                    diet_plan = userProfile[0].diet_plans;
                    profile = userProfile[0]._doc;
                }
            }
            userData = {...user._doc, diet_plan: diet_plan, profile: profile};


            return res.status(200).json(ApiResponse.success('User retrieved successfully', userData));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error'));
        }
    }

    static async updateUser(req, res) {
        try {
            const {id} = req.params;
            const {is_active, role, diet_plan} = req.body;

            if (mongoose.Types.ObjectId.isValid(id) === false) {
                return res.status(400).json(ApiResponse.error('Invalid user id'));
            }

            const user = await User.findById(id)
            if (!user) {
                return res.status(400).json(ApiResponse.error('User not found'));
            }

            if (is_active !== undefined && is_active !== '' && is_active !== null && is_active !== 'null')
                user.is_active = is_active;
            if (role !== undefined && role !== '' && role !== null && role !== 'null')
                user.role = role;

            if (diet_plan !== undefined && diet_plan !== '' && diet_plan !== null && diet_plan !== 'null') {
                if(mongoose.Types.ObjectId.isValid(diet_plan) === false){
                    return res.status(400).json(ApiResponse.error('Invalid diet plan id'));
                }
                let userProfile = await UserProfile.find({'user_id': user._id});
                if (userProfile.length > 0) {
                    userProfile[0].diet_plan = [diet_plan];
                    await userProfile[0].save();
                }
            }

            await user.save();


            return res.status(200).json(ApiResponse.success('User updated successfully', user));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error'));
        }
    }

    static async updatePassword(req, res) {
        try {
            const {user_id, old_password, new_password} = req.body;


            if (mongoose.Types.ObjectId.isValid(user_id) === false) {
                return res.status(400).json({error: 'Invalid user id'});
            }

            const user = await User.findById(user_id)
            if (!user) {
                return res.status(400).json(ApiResponse.error('User not found'));
            }

            if (user.password !== old_password) {
                return res.status(400).json(ApiResponse.error('Old password is incorrect'));
            }

            user.password = new_password;

            await user.save();

            return res.status(200).json(ApiResponse.success('Password updated successfully', true));

        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error'));
        }
    }

    static async deleteUser(req, res) {
        try {
            const {id} = req.params;
            const user = await User.findByIdAndDelete(id);
            if (!user) {
                return res.status(400).json(ApiResponse.error('User not found'));
            }
            return res.status(200).json(ApiResponse.success('User deleted successfully', true));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || 'Internal server error'));
        }
    }


}

export default UserController;
import ApiResponse from '../../utils/api_response.js';
import jwt from 'jsonwebtoken';
import {User} from '../../models/auth/user.model.js';
import {createjwtToken} from '../../utils/jwt_helper.js';
import mongoose from 'mongoose';
import {generate} from "generate-password";


function generatePassword(){
    return generate({
        length: 10,
        uppercase:true,
        numbers: true
    })
}

class AuthController {
    static async google(req, res) {
        const { token } = req.body


        if (token === undefined || token == null || token === '') {
            return res.status(400).json(ApiResponse.error('token is required'))

        }
        try {
            const data = jwt.decode(token);
            const { sub, name, email, picture, email_verified } = data

            if (!email_verified)
                return res.status(400).json(ApiResponse.error("Google account is not verified"))

            const googleUserId = sub

            let user;

            const existingUser = await User.findOne({ 'email': email }).select("-__v ")

            user = existingUser
            let res_message = 'User loggedIn Successfully'

            if (existingUser == null) {

                // create new user
                user = await User.create(
                    {
                        google_id: googleUserId,
                        name,
                        email,
                        password: generatePassword(),
                        image_url: picture,
                        role: 'user',
                        status_id: 0,
                        token: null
                    }
                )
                res_message = "User created Successfully"
            }
            user.token = await createjwtToken({
                "id": user._id,
                "google_id": user.google_id,
                "name": user.name,
                "email": user.email,
                "image_url": user.image_url,
                "role": user.role,
                "status_id": user.status_id,
            })
            await user.save({ validation: false })

            const updatedUser = await User.findById(user.id).select("-__v -password");

            return res.status(200).json(ApiResponse.success(res_message, updatedUser))

        } catch (error) {

            return res.status(400).json(ApiResponse.error(error.message || 'Internal Server Error'))
        }
    }


    static async emailAndPasswordLogin(req, res) {
        let { email,password,is_admin } = req.body

        if (email === undefined || email == null || email === '') {
            return res.status(400).json(ApiResponse.error('email is required'))
        }
        if (password === undefined || password == null || password === '') {
            return res.status(400).json(ApiResponse.error('password is required'))
        }

        if (!is_admin){
            is_admin = true
        }

        try {


            const existingUser = await User.findOne({ 'email': email,'password':password }).select("-__v ")

            if (existingUser === null || existingUser === undefined)
                return res.status(400).json(ApiResponse.error('Invalid email or password'))

            if (existingUser.role !== 'admin' && is_admin)
                return res.status(400).json(ApiResponse.error('User is not an admin'))

            let res_message = 'User loggedIn Successfully'

            existingUser.token = await createjwtToken({
                "id": existingUser._id,
                "google_id": existingUser.google_id,
                "name": existingUser.name,
                "email": existingUser.email,
                "image_url": existingUser.image_url,
                "role": existingUser.role,
                "status_id": existingUser.status_id,
            })
            await existingUser.save({ validation: false })

            const updatedUser = await User.findById(existingUser.id).select("-__v -password");

            // Set the token in cookies
            res.cookie('token', updatedUser.token, { httpOnly: true });

            return res.status(200).json(ApiResponse.success(res_message, updatedUser))

        } catch (error) {

            res.clearCookie('token');
            return res.status(400).json(ApiResponse.error(error.message || 'Internal Server Error'))
        }
    }

    static async verify(req, res) {
        const { user_id } = req.body

        if (user_id === undefined || user_id == null || user_id === '') {
            return res.status(400).json(ApiResponse.error('token is required'))

        }
        try {
            if (!mongoose.Types.ObjectId.isValid(user_id)) // true
                return res.status(400).json(ApiResponse.error('Invalid User'))

            const existingUser = await User.findById(user_id).select("-__v -password")

            res.cookie('token', existingUser.token, { httpOnly: true });

            return res.status(200).json(ApiResponse.success('User Verified', existingUser))

        } catch (error) {

            res.clearCookie('token');
            return res.status(400).json(ApiResponse.error(error.message || 'Internal Server Error'))
        }
    }

    static async logout(req, res) {
        const { token } = req.body

        if (token === undefined || token == null || token === '') {
            return res.status(400).json(ApiResponse.error('token is required'))

        }
        try {
            const data = jwt.verify(token, process.env.JWT_SECRET_KEY);

            if (data === null || data === undefined)
                return res.status(400).json(ApiResponse.error('Invalid token'))

            const { id, } = data

            if (!mongoose.Types.ObjectId.isValid(id)) // true
                return res.status(400).json(ApiResponse.error('Invalid User'))


            const existingUser = await User.findOne({ '_id': id }).select("-__v")

            if (existingUser === null || existingUser === undefined)
                return res.status(400).json(ApiResponse.error('User does not exist'))

            if (existingUser.token !== token)
                return res.status(400).json(ApiResponse.error('Session Expired, Please login again'))

            existingUser.token = null
            await existingUser.save({ validation: false })

            res.clearCookie('token');

            return res.status(200).json(ApiResponse.success('Logout successful', true))

        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || 'Internal Server Error'))
        }
    }
}

export default AuthController;
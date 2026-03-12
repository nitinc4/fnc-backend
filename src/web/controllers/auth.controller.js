import {User} from "../../models/auth/user.model.js";
import SettingController from "./setting.controller.js";


class AuthController {

    static async login(req, res) {
        const {email, password} = req.body;
        console.log(email, password);
        console.log("login post called")

        const user = await User.findOne({email: email, password: password});
        if (!user) {

            return res.render('pages/auth/login', {error: 'Invalid email or password'});
        }
        res.cookie('token', user.token, {maxAge: 24 * 60 * 60 * 1000, httpOnly: true});
        return res.redirect('/dashboard');


    }

    static async logout(req, res) {
        console.log("logout called")
        res.clearCookie('token');
        res.redirect('/user/login');
    }

}

export default AuthController;
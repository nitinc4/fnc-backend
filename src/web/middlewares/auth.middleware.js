//check if user is loggedIn and redirect to login page if not
import {User} from "../../models/auth/user.model.js";

async function authenticate(req, res, next) {
    //get cookies from request
    const token = req.cookies.token;
    //check if user is loggedIn
    if (!token) {
        return res.redirect('/user/login');
    }
    const user = await User.findOne({token: token}).select('-password -__v -token -createdAt -updatedAt')
    if (!user) {
        req.clearCookie('token');
        return res.redirect('/user/login');
    }
    req.user = user;
        console.log("user is logged in", token)
    next();

}



export default authenticate;
import ApiResponse from "../../utils/api_response.js";
import { User } from "../../models/auth/user.model.js";

const isAdmin = async (req, res, next) => {
    try {
        const user_id = req.body.user_id;

        if (!user_id) {
            return res.status(401).json(ApiResponse.error('Unauthorized user id missing'));
        }

        const user = await User.findById(user_id);

        if (!user) {
            return res.status(404).json(ApiResponse.error('User not found'));
        }

        if (user.role === 'admin' || user.role === 'superadmin') {
            next();
        } else {
            return res.status(403).json(ApiResponse.error('Access denied. Admin privileges required.'));
        }
    } catch (error) {
        return res.status(500).json(ApiResponse.error(error.message || 'Internal Server Error during role check'));
    }
};

export { isAdmin };

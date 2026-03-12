import {decode} from "jsonwebtoken"
import ApiResponse from "../../utils/api_response.js"
import {User} from "../../models/auth/user.model.js"


function validateGoogleBearerToken(req, res, next) {
    const authorization = req.headers.authorization
    if (authorization === '' || authorization === undefined)
        return res.status(400).json(ApiResponse.error('token was not found in the header'))

    const isBearer = String(authorization).includes('Bearer ')
    if (!isBearer)
        return res.status(400).json(ApiResponse.error('invalid Bearer token'))

    req.body.token = String(authorization).replace("Bearer ", "")


    next()
}


async function authenticateRequest(req, res, next) {
    let token;

    // Check if token exists in the Authorization header
    const authorizationHeader = req.headers.authorization;
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
        // Extract token from the header
        token = authorizationHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        // If token not found in header, check cookies
        token = req.cookies.token;
    }

    if (token === '' || token === undefined)
        return res.status(400).json(ApiResponse.error('Unauthorised Request'))

    try {

        const decoded = await decode(token)

        if (decoded === null || decoded === undefined)
            return res.status(400).json(ApiResponse.error('Invalid token'))
        const user_id = decoded.id

        if (user_id === undefined || user_id === '')
            return res.status(400).json(ApiResponse.error('Invalid user, try login again'))

        //find user from db
        const user = await User.findOne({ _id: user_id })

        if (user === null)
            return res.status(400).json(ApiResponse.error('Unauthorized User'))
        if (user.token !== token)
            return res.status(400).json(ApiResponse.error('Session Expired, Please login again'))
        req.body.user_id = user._id
        next()
    } catch (error) {
        return res.status(500).json(ApiResponse.error(error.message || 'Internal Server Error'))
    }
}
export { validateGoogleBearerToken, authenticateRequest }
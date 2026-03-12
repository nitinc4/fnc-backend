import jwt from 'jsonwebtoken'

async function createjwtToken(data, expiry) {
    return jwt.sign(data, process.env.JWT_SECRET_KEY)

}

export { createjwtToken }
import express from "express";
import authRouter from "./routes/auth.route.js";
import authenticate from "./middlewares/auth.middleware.js";
import checkLogin from "./middlewares/login.middleware.js";

const router = express.Router();

router.get('/', (req, res) => {
    res.render(
        'index'
    )
})

router.use('/auth', authRouter);

export default router;

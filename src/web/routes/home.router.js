import express from 'express';
import HomeController from "../controllers/home.controller.js";
import authenticate from "../middlewares/auth.middleware.js";

const router = express.Router();


export default router;
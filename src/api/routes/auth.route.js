import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import { validateGoogleBearerToken, authenticateRequest } from '../middlewares/auth.middleware.js';

const router = express.Router();

//login user with google
router.get('/google', validateGoogleBearerToken, AuthController.google);

//login user with email and password
router.post('/login', AuthController.emailAndPasswordLogin);

//verify user
router.get('/verify', authenticateRequest, AuthController.verify);

//logout user
router.get('/logout', authenticateRequest, AuthController.logout);

export default router;
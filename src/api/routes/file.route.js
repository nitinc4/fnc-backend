import express from "express";
import FileController from "../controllers/file.controller.js";
import multerResponseMiddleware from "../middlewares/file.middelware.js";
// Make sure this path points to your actual auth middleware
import { authenticateRequest } from "../middlewares/auth.middleware.js"; 

const router = express.Router();

router.get('/', FileController.get);
router.get('/view/:filename', FileController.serve); 

// Added authentication middleware so req.user is attached to the upload
router.post('/', authenticateRequest, multerResponseMiddleware, FileController.add);

router.delete('/', FileController.delete);

export default router;
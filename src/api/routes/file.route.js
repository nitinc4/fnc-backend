import express from "express";
import FileController from "../controllers/file.controller.js";
// multerResponseMiddleware handles the file storage part
import multerResponseMiddleware from "../middlewares/file.middelware.js";
import { authenticateRequest } from "../middlewares/auth.middleware.js"; 

const router = express.Router();

// List all files (with optional userId query param)
router.get('/', FileController.list);

// Securely view/download a file by filename
router.get('/view/:filename', FileController.view); 

// Upload a new file (accepts both physical upload and manual path records)
router.post('/', authenticateRequest, multerResponseMiddleware, FileController.add);

// Delete a file (supports ID in params or pathname in body)
router.delete('/:id?', authenticateRequest, FileController.delete);

export default router;
import express from "express";
import FileController from "../controllers/file.controller.js";
import multerResponseMiddleware from "../middlewares/file.middelware.js";

const router = express.Router();

router.get('/', FileController.get);

// Route to view/download actual files straight from MongoDB
router.get('/view/:filename', FileController.serve); 

router.post('/', multerResponseMiddleware, FileController.add);

router.delete('/', FileController.delete);

export default router;
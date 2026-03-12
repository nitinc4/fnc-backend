import express from "express";
import ProfileController from "../controllers/profile.controller.js";

const router = express.Router();


router.get('/',ProfileController.getProfile)

router.post('/',ProfileController.createProfile)

router.put('/',ProfileController.updateProfile)

router.delete('/',ProfileController.deleteProfile)
export default router;

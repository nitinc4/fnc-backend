import express from "express";
import SettingController from "../controllers/setting.controller.js";

const router = express.Router();

router.get("/", SettingController.getSetting)

router.put("/", SettingController.updateSetting)

export default router;
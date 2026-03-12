import express from "express";
import OverviewController from "../controllers/overview.controller.js";

const router = express.Router();

router.get('/',OverviewController.getOverview)

export default router;

import express from "express";
import ConsultationController from "../controllers/consultation.controller.js";

const router = express.Router();

router.get("/", ConsultationController.getAllClaims);
router.post("/redeem", ConsultationController.redeemClaim);

export default router;

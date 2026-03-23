import express from "express";
import ConsultationController from "../controllers/consultation.controller.js";

const router = express.Router();

router.post("/claim", ConsultationController.claimConsultation);

export default router;

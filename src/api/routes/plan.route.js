import express from "express";
import PlanContoller from "../controllers/plan.contoller.js";

const router = express.Router();

router.get("/", PlanContoller.get)

router.get("/:id", PlanContoller.getById)

router.post("/", PlanContoller.create)

router.put("/:id", PlanContoller.update)

router.delete("/:id", PlanContoller.delete)

export default router;

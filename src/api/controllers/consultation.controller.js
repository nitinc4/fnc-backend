import mongoose from "mongoose";
import ApiResponse from "../../utils/api_response.js";
import { User } from "../../models/auth/user.model.js";
import { Plan } from "../../models/plan/plan.model.js";
import { ConsultationClaim } from "../../models/consultation/consultation_claim.model.js";

function isPremiumPlan(planValue) {
    if (!planValue) return false;
    const normalized = String(planValue).trim().toLowerCase();
    return normalized === "premium" || normalized === "paid";
}

async function ensureAdminUser(userId) {
    const actingUser = await User.findById(userId).select("role");
    if (!actingUser) return false;
    return actingUser.role === "admin" || actingUser.role === "superadmin";
}

class ConsultationController {
    static async claimConsultation(req, res) {
        try {
            const { user_id, plan_id, claim_code } = req.body;

            if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
                return res.status(400).json(ApiResponse.error("Invalid user"));
            }

            if (!plan_id || !mongoose.Types.ObjectId.isValid(plan_id)) {
                return res.status(400).json(ApiResponse.error("Invalid { plan_id }"));
            }

            if (!claim_code) {
                return res.status(400).json(ApiResponse.error("{ claim_code } is required"));
            }

            const normalizedCode = String(claim_code).trim().toUpperCase();
            const isValidCode = /^[A-Z0-9]{6}$/.test(normalizedCode);
            if (!isValidCode) {
                return res.status(400).json(ApiResponse.error("{ claim_code } must be a 6 character alphanumeric code"));
            }

            const user = await User.findById(user_id);
            if (!user) {
                return res.status(404).json(ApiResponse.error("User not found"));
            }

            const plan = await Plan.findById(plan_id).select("_id name");
            if (!plan) {
                return res.status(404).json(ApiResponse.error("Plan not found"));
            }

            const claimsUsed = Number(user.claimed_free_consultations || 0);
            let eligible = false;

            if (claimsUsed === 0) {
                eligible = true;
            } else if (claimsUsed === 1 && isPremiumPlan(user.plan)) {
                eligible = true;
            }

            if (!eligible) {
                return res.status(400).json(ApiResponse.error("Not eligible for free consultation claim"));
            }

            const existingCode = await ConsultationClaim.findOne({ claim_code: normalizedCode }).select("_id");
            if (existingCode) {
                return res.status(409).json(ApiResponse.error("This claim code already exists. Please generate a new code."));
            }

            const claim = await ConsultationClaim.create({
                user_id: user._id,
                plan_id: plan._id,
                claim_code: normalizedCode,
                status: "Pending",
            });

            user.claimed_free_consultations = claimsUsed + 1;
            await user.save();

            const createdClaim = await ConsultationClaim.findById(claim._id)
                .populate({ path: "user_id", select: "name email" })
                .populate({ path: "plan_id", select: "name" })
                .select("-__v");

            return res.status(200).json(
                ApiResponse.success("Consultation claim created successfully", {
                    claim: createdClaim,
                    claimed_free_consultations: user.claimed_free_consultations,
                })
            );
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || "Internal server error"));
        }
    }

    static async getAllClaims(req, res) {
        try {
            const { user_id } = req.body;
            const isAdmin = await ensureAdminUser(user_id);
            if (!isAdmin) {
                return res.status(403).json(ApiResponse.error("Admin access required"));
            }

            const { code, status } = req.query;
            const filters = {};

            if (code && code !== "null" && code !== "") {
                filters.claim_code = String(code).trim().toUpperCase();
            }
            if (status && status !== "null" && status !== "") {
                filters.status = status;
            }

            const claims = await ConsultationClaim.find(filters)
                .populate({ path: "user_id", select: "name email" })
                .populate({ path: "plan_id", select: "name" })
                .select("-__v")
                .sort({ createdAt: -1 });

            return res.status(200).json(ApiResponse.success("Consultation claims fetched successfully", claims));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || "Internal server error"));
        }
    }

    static async redeemClaim(req, res) {
        try {
            const { user_id, code } = req.body;
            const isAdmin = await ensureAdminUser(user_id);
            if (!isAdmin) {
                return res.status(403).json(ApiResponse.error("Admin access required"));
            }

            if (!code) {
                return res.status(400).json(ApiResponse.error("{ code } is required"));
            }

            const normalizedCode = String(code).trim().toUpperCase();
            const claim = await ConsultationClaim.findOne({ claim_code: normalizedCode })
                .populate({ path: "user_id", select: "name email" })
                .populate({ path: "plan_id", select: "name" });

            if (!claim) {
                return res.status(404).json(ApiResponse.error("Claim code not found"));
            }

            if (claim.status !== "Pending") {
                return res.status(400).json(ApiResponse.error(`Claim is already ${claim.status}`));
            }

            claim.status = "Redeemed";
            await claim.save();

            return res.status(200).json(ApiResponse.success("Claim redeemed successfully", claim));
        } catch (error) {
            return res.status(500).json(ApiResponse.error(error.message || "Internal server error"));
        }
    }
}

export default ConsultationController;

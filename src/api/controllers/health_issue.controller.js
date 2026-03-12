import ApiResponse from "../../utils/api_response.js"
import mongoose from "mongoose"

import { HealthIssue } from "../../models/health_issue/health_issue.model.js"


const ObjectId = mongoose.Types.ObjectId;

class HealthIssueController {

    //get  all health issues
    static async getAllHealthIssues(req, res) {
        try {

            const result = await HealthIssue.find().select("-__v")

            return res.status(200).json(ApiResponse.success("Health Issues List fetched", result))

        } catch (error) {
            return res.status(400).json(ApiResponse.error(error.message || "Internal Server Error"))
        }
    }


    //get health issue by  id
    static async getHealthIssueById(req, res) {
        const issue_id = String(req.params.id)
        if (issue_id === undefined || issue_id === '')
            return res.status(400).json(ApiResponse.error("Invalid Heath issue id"))

        try {

            //check id validation by mongoose
            const isValidId = ObjectId.isValid(issue_id);
            if (!isValidId)
                return res.status(400).json(ApiResponse.error("Invalid HealthIssue Id"))

            const result = await HealthIssue.findById(issue_id).select("-__v")

            if (result !== null) {
                return res.status(200).json(ApiResponse.success("Health Issue found", result))
            } else {
                return res.status(400).json(ApiResponse.error("No Health issue found with this id"))
            }
        } catch (error) {
            return res.status(400).json(ApiResponse.error(error.message || "Internal Server Error"))
        }
    }


    //add health issue
    static async addHealthIssue(req, res) {

        const { name, description, risk_factor, cause, treatment } = req.body

        if (name === undefined || name === '')
            return res.status(400).json(ApiResponse.error("'name' field is required"))

        if (risk_factor === undefined || risk_factor === '')
            return res.status(400).json(ApiResponse.error("'risk_factor' field is required"))

        if (cause === undefined || cause === '')
            return res.status(400).json(ApiResponse.error("'cause' field is required"))

        if (treatment === undefined || treatment === '')
            return res.status(400).json(ApiResponse.error("'treatment' field is required"))

        try {

            const result = await HealthIssue.create({
                name,
                description: description || null,
                cause,
                risk_factor,
                treatment,

            })

            return res.status(200).json(ApiResponse.success("Health Issue Added", result))

        } catch (error) {
            return res.status(400).json(ApiResponse.error(error.message || "Internal Server Error"))
        }


    }

    //update health issue
    static async updateHealthIssue(req, res) {
        const issue_id = String(req.params.id)
        const { name, description, risk_factor, cause, treatment } = req.body

        try {
            //check id validation    
            const isValidId = ObjectId.isValid(issue_id);
            if (!isValidId)
                return res.status(400).json(ApiResponse.error("Invalid HealthIssue Id"))

            //find object by id
            const healthIssue = await HealthIssue.findOne({ '_id': issue_id })

            if (healthIssue == null)
                return res.status(400).json(ApiResponse.error("Health Issue does not Exist"))

            if (!(name === undefined || name == null || name === '')) {
                healthIssue.name = name
            }
            if (!(description === undefined || description == null || description === '')) {
                healthIssue.description = description
            }
            if (!(risk_factor === undefined || risk_factor == null || risk_factor === '')) {
                healthIssue.risk_factor = risk_factor
            } if (!(cause === undefined || cause == null || cause === '')) {
                healthIssue.cause = cause
            } if (!(treatment === undefined || treatment == null || treatment === '')) {
                healthIssue.treatment = treatment
            }
            await healthIssue.save({ validation: false })

            return res.status(200).json(ApiResponse.success("Health Issue Updated successfully", healthIssue))

        } catch (error) {

            return res.status(400).json(ApiResponse.error(error.message || "Internal Server Error",))

        }


    }

    static async deleteHealthIssue(req, res) {
        const issue_id = String(req.params.id)

        try {
            const isValidId = ObjectId.isValid(issue_id);

            if (!isValidId)
                return res.status(400).json(ApiResponse.error("Invalid HealthIssue Id"))

            const healthIssue = await HealthIssue.findOneAndDelete({ _id: { $eq: issue_id } })

            if (healthIssue == null)
                return res.status(400).json(ApiResponse.error("Health issue is not available"))

            return res.status(200).json(ApiResponse.success
                ("Health Issue deleted successfully", healthIssue))

        } catch (error) {
            return res.status(400).json(ApiResponse.error(error.message || "Internal Server Error"))
        }
    }

}

export default HealthIssueController
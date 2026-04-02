import { File } from "../../models/file/file.model.js";
import ApiResponse from "../../utils/api_response.js";
import mongoose from "mongoose";

class FileController {
    // Corresponds to router.post('/', FileController.add)
    static async add(req, res) {
        try {
            const { url, type, description } = req.body;
            // req.user is attached by authenticateRequest middleware
            const user_id = req.user ? req.user._id : null;

            const file = new File({ url, type, description, user_id });
            await file.save();
            return res.status(201).json(ApiResponse.success('File uploaded and recorded successfully', file));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    // Corresponds to router.get('/', FileController.get)
    static async get(req, res) {
        try {
            const query = {};
            if (req.query.user_id) query.user_id = req.query.user_id;
            const files = await File.find(query).sort({ createdAt: -1 });
            return res.status(200).json(ApiResponse.success('Files retrieved successfully', files));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    // Corresponds to router.delete('/', FileController.delete)
    // In file.route.js it's router.delete('/', FileController.delete)
    // but usually it expects an ID in the body or query if not in params
    static async delete(req, res) {
        try {
            const { id } = req.query; // Assuming ID is passed in query for root DELETE
            if (!id) return res.status(400).json(ApiResponse.error('File ID is required'));

            const file = await File.findByIdAndDelete(id);
            if (!file) return res.status(404).json(ApiResponse.error('File not found'));
            return res.status(200).json(ApiResponse.success('File deleted successfully'));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    // Corresponds to router.get('/view/:filename', FileController.serve)
    static async serve(req, res) {
        try {
            const { filename } = req.params;
            // Since FNC usually stores full URLs or relative paths, 
            // this might need to serve a local file or redirect.
            // Placeholder: redirection if it's a URL, or potentially actual local serving.
            return res.status(200).json(ApiResponse.success('Serving file feature coming soon', { filename }));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }
}

export default FileController;

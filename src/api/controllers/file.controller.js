// src/api/controllers/file.controller.js
const File = require('../../models/file/file.model');
const ApiResponse = require('../utils/ApiResponse');

class FileController {
    static async uploadFile(req, res) {
        try {
            const { url, type, description, user_id } = req.body;
            const file = new File({ url, type, description, user_id });
            await file.save();
            return res.status(201).json(ApiResponse.success(file, 'File uploaded and recorded successfully'));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    static async getFiles(req, res) {
        try {
            const query = {};
            if (req.query.user_id) query.user_id = req.query.user_id;
            const files = await File.find(query).sort({ createdAt: -1 });
            return res.status(200).json(ApiResponse.success(files));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    static async deleteFile(req, res) {
        try {
            const file = await File.findByIdAndDelete(req.params.id);
            if (!file) return res.status(404).json(ApiResponse.error('File not found'));
            return res.status(200).json(ApiResponse.success(null, 'File deleted successfully'));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }
}

module.exports = FileController;

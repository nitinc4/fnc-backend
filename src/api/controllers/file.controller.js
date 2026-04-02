import { File } from "../../models/file/file.model.js";
import ApiResponse from "../../utils/api_response.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

class FileController {
    // Corresponds to router.post('/', FileController.add)
    static async add(req, res) {
        try {
            const { url: bodyUrl, type: bodyType, description: bodyDescription } = req.body;
            let finalUrl = bodyUrl;
            let finalType = bodyType || 'other';

            // Check if a file was uploaded via multer
            if (req.file) {
                const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                const fileName = `${Date.now()}-${req.file.originalname}`;
                const filePath = path.join(uploadDir, fileName);
                
                // Write buffer to file
                fs.writeFileSync(filePath, req.file.buffer);
                
                // Construct the public URL
                // Assuming the server serves /public/uploads as static
                finalUrl = `public/uploads/${fileName}`;
                
                // Determine type based on mimetype
                if (req.file.mimetype.startsWith('image/')) {
                    finalType = 'image';
                } else if (req.file.mimetype === 'application/pdf') {
                    finalType = 'pdf';
                }
            }

            if (!finalUrl) {
                return res.status(400).json(ApiResponse.error('File or URL is required'));
            }

            // req.user is attached by authenticateRequest middleware
            const user_id = req.user ? req.user._id : null;

            const description = bodyDescription || "";
            const file = new File({ url: finalUrl, type: finalType, description, user_id });
            await file.save();
            return res.status(201).json(ApiResponse.success('File uploaded and recorded successfully', file));
        } catch (e) {
            console.error("Upload error:", e);
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
    static async delete(req, res) {
        try {
            const { id } = req.query;
            if (!id) return res.status(400).json(ApiResponse.error('File ID is required'));

            const file = await File.findById(id);
            if (!file) return res.status(404).json(ApiResponse.error('File not found'));

            // Optionally delete the physical file if it's local
            if (file.url.startsWith('public/uploads/')) {
                const filePath = path.join(process.cwd(), file.url);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            await File.findByIdAndDelete(id);
            return res.status(200).json(ApiResponse.success('File deleted successfully'));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }

    // Corresponds to router.get('/view/:filename', FileController.serve)
    static async serve(req, res) {
        try {
            const { filename } = req.params;
            const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
            
            if (fs.existsSync(filePath)) {
                return res.sendFile(filePath);
            }
            
            return res.status(404).json(ApiResponse.error('File not found'));
        } catch (e) {
            return res.status(500).json(ApiResponse.error(e.message));
        }
    }
}

export default FileController;


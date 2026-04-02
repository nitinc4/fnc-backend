import ApiResponse from "../../utils/api_response.js";
import FileModel from "../../models/file/file.model.js";
import path from "path";

class FileController {

    static async get(req, res) {
        try {
            // NEW: Filter by userId if it's provided in the query string
            const query = {};
            if (req.query.userId) {
                query.user = req.query.userId;
            }

            const allFiles = await FileModel.find(query, '-data').populate('user', 'name email phone');
            
            const filesData = allFiles.map(file => {
                return {
                    _id: file._id,
                    path: path.join(file.directory, file.name).replace(/\\/g, '/'),
                    name: file.name,
                    directory: file.directory,
                    contentType: file.contentType,
                    size: file.size,
                    createdAt: file.createdAt,
                    user: file.user || null,
                    description: file.description || ''
                };
            });

            res.status(200).send(ApiResponse.success('Files retrieved successfully', filesData));

        } catch (e) {
            res.status(500).send(ApiResponse.error(e.message || 'Internal Server Error'));
        }
    }

    static async add(req, res) {
        try {
            let { name, directory, userId, description } = req.body;
            
            // FIX: Robustly extract the user ID regardless of how the token is structured
            let finalUserId = null;
            if (req.user) {
                finalUserId = req.user._id || req.user.id || req.user.userId;
            }
            // If middleware failed but Flutter passed the ID in the body, use it
            if (!finalUserId && userId) {
                finalUserId = userId;
            }

            if (!name) name = req.file.originalname.split('.')[0];
            if (!directory) directory = 'public';

            const ext = path.extname(req.file.originalname);
            const finalName = name + ext;

            const newFile = new FileModel({
                name: finalName,
                data: req.file.buffer,
                contentType: req.file.mimetype,
                size: req.file.size,
                directory: directory,
                user: finalUserId, // Now safely attached
                description: description || ''
            });

            await newFile.save();

            const uploadedFile = {
                filename: finalName,
                path: directory + '/' + finalName,
                size: req.file.size,
                mimetype: req.file.mimetype,
                user: finalUserId
            };

            return res.status(200).send(ApiResponse.success('File uploaded successfully', uploadedFile));

        } catch (e) {
            res.status(500).send(ApiResponse.error(e.message || 'Internal Server Error'));
        }
    }

    static async delete(req, res) {
        try {
            const { pathname } = req.body;
            if (!pathname) return res.status(400).send(ApiResponse.error('{ pathname } is required'));

            const filename = path.basename(pathname);
            const deletedFile = await FileModel.findOneAndDelete({ name: filename });

            if (!deletedFile) return res.status(404).send(ApiResponse.error('File not found'));

            return res.status(200).send(ApiResponse.success('File deleted successfully', true));

        } catch (e) {
            res.status(500).send(ApiResponse.error(e.message || 'Internal Server Error'));
        }
    }

    static async serve(req, res) {
        try {
            const { filename } = req.params;
            const file = await FileModel.findOne({ name: filename });
            
            if (!file) return res.status(404).send(ApiResponse.error('File not found'));

            if (file.contentType === 'application/pdf') {
                res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
            }

            res.set('Content-Type', file.contentType);
            res.send(file.data);
        } catch (e) {
            res.status(500).send(ApiResponse.error(e.message || 'Internal Server Error'));
        }
    }
}

export default FileController;
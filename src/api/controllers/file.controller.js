import ApiResponse from "../../utils/api_response.js";
import FileModel from "../../models/file/file.model.js";
import path from "path";

class FileController {

    static async get(req, res) {
        try {
            // Get all files from MongoDB (excluding actual file buffer to save memory/bandwidth)
            const allFiles = await FileModel.find({}, 'name directory');
            
            // Reconstruct the file paths format expected by the frontend
            const filePaths = allFiles.map(file => {
                // Return format e.g., 'public/image.png'
                return path.join(file.directory, file.name).replace(/\\/g, '/');
            });

            res.status(200).send(ApiResponse.success('Files retrieved successfully', filePaths));

        } catch (e) {
            res.status(500).send(ApiResponse.error(e.message || 'Internal Server Error'));
        }
    }

    static async add(req, res) {
        try {
            let { name, directory } = req.body;

            if (!name) {
                name = req.file.originalname.split('.')[0];
            }

            if (!directory) {
                directory = 'public';
            }

            const ext = path.extname(req.file.originalname);
            const finalName = name + ext;

            // Save file data to MongoDB
            const newFile = new FileModel({
                name: finalName,
                data: req.file.buffer,
                contentType: req.file.mimetype,
                size: req.file.size,
                directory: directory
            });

            await newFile.save();

            const uploadedFile = {
                filename: finalName,
                path: directory + '/' + finalName,
                size: req.file.size,
                mimetype: req.file.mimetype
            };

            return res.status(200).send(ApiResponse.success('File uploaded successfully', uploadedFile));

        } catch (e) {
            res.status(500).send(ApiResponse.error(e.message || 'Internal Server Error'));
        }
    }

    static async delete(req, res) {
        try {
            const { pathname } = req.body;

            if (!pathname) {
                return res.status(400).send(ApiResponse.error('{ pathname } is required'));
            }

            // Extract just the filename from the pathname
            const filename = path.basename(pathname);

            // Delete file document from MongoDB
            const deletedFile = await FileModel.findOneAndDelete({ name: filename });

            if (!deletedFile) {
                return res.status(404).send(ApiResponse.error('File not found'));
            }

            return res.status(200).send(ApiResponse.success('File deleted successfully', true));

        } catch (e) {
            res.status(500).send(ApiResponse.error(e.message || 'Internal Server Error'));
        }
    }

    // New Method: Allows frontend/users to access/view the image via a URL
    static async serve(req, res) {
        try {
            const { filename } = req.params;
            const file = await FileModel.findOne({ name: filename });
            
            if (!file) {
                return res.status(404).send(ApiResponse.error('File not found'));
            }

            res.set('Content-Type', file.contentType);
            res.send(file.data);
        } catch (e) {
            res.status(500).send(ApiResponse.error(e.message || 'Internal Server Error'));
        }
    }
}

export default FileController;
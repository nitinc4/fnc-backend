import ApiResponse from "../../utils/api_response.js";
import FileModel from "../../models/file/file.model.js";
import path from "path";

class FileController {

    static async get(req, res) {
        try {
            // Retrieve files without the heavy data buffer, and populate the User info
            const allFiles = await FileModel.find({}, '-data').populate('user', 'name email phone');
            
            // Format the response as an array of detailed objects
            const filesData = allFiles.map(file => {
                return {
                    _id: file._id,
                    path: path.join(file.directory, file.name).replace(/\\/g, '/'),
                    name: file.name,
                    directory: file.directory,
                    contentType: file.contentType,
                    size: file.size,
                    createdAt: file.createdAt,
                    user: file.user || null // Includes name and email from population
                };
            });

            res.status(200).send(ApiResponse.success('Files retrieved successfully', filesData));

        } catch (e) {
            res.status(500).send(ApiResponse.error(e.message || 'Internal Server Error'));
        }
    }

    static async add(req, res) {
        try {
            let { name, directory } = req.body;
            // Capture the user ID from your auth middleware
            const userId = req.user ? req.user._id : null; 

            if (!name) {
                name = req.file.originalname.split('.')[0];
            }

            if (!directory) {
                directory = 'public';
            }

            const ext = path.extname(req.file.originalname);
            const finalName = name + ext;

            const newFile = new FileModel({
                name: finalName,
                data: req.file.buffer,
                contentType: req.file.mimetype,
                size: req.file.size,
                directory: directory,
                user: userId // Save the association
            });

            await newFile.save();

            const uploadedFile = {
                filename: finalName,
                path: directory + '/' + finalName,
                size: req.file.size,
                mimetype: req.file.mimetype,
                user: userId
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

            // Enable PDFs to open directly in the browser instead of forcing a download
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
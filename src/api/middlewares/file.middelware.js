import upload from "../../utils/file_upload.js";
import multer from "multer";
import ApiResponse from "../../utils/api_response.js";

// Custom middleware to send a response from Multer
function multerResponseMiddleware(req, res, next) {
    upload.single('file')(req, res, function (err) {
        if (err) {
            if (err instanceof multer.MulterError) {
                // If more than one file is attempted to be uploaded
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json(ApiResponse.error('Only single file uploads is allowed at a time'));
                } 
                // Handle the 5MB limit error
                else if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json(ApiResponse.error('File size exceeds the 5MB limit'));
                } else {
                    return res.status(500).json(ApiResponse.error(err.message || 'Multer Error'));
                }
            } else {
                // Other errors
                return res.status(500).json(ApiResponse.error(err.message || 'Internal Server Error'));
            }
        } else {
            // File upload successful
            if (!req.file) {
                return res.status(400).json(ApiResponse.error('No file uploaded'));
            }
            next();
        }
    });
}

export default multerResponseMiddleware;
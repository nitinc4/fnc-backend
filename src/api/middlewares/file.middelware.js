import upload from "../../utils/file_upload.js";
import multer from "multer";
import ApiResponse from "../../utils/api_response.js";
// Custom middleware to send a response from Multer
function multerResponseMiddleware(req, res, next) {
    upload.single('file')(req, res, function (err) {
        if (err) {
            // If more than one file is attempted to be uploaded
            if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json(ApiResponse.error('Only single file uploads is allowed at a time'));
            } else {
                // Other Multer errors
                return res.status(500).json(ApiResponse.error(err.message || 'Internal Server Error'));
            }
        } else {
            // File upload successful
            if (!req.file) {
                return res.status(400).json(ApiResponse.error('No file uploaded')   );
            }
            // Send a success response with uploaded file details
            //res.status(200).json(ApiResponse.success('File uploaded successfully', req.file)  );
            next();
        }
    });

}

export default multerResponseMiddleware;

import multer from 'multer';

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public'); // Define the destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Keep the original filename
    }
});

// Initialize multer with the defined storage configuration
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 }, // Example: Limit file size to 1MB (adjust as needed)
    fileFilter: function (req, file, cb) {
        // Accept only a single file
        if (!req.file) {
            req.file = file;
            cb(null, true);
        } else {
            cb(new Error('Only single file uploads are allowed'));
        }
    }
});

export default upload;
import multer from 'multer';

// Use memory storage to keep the file in memory as a Buffer for MongoDB
const storage = multer.memoryStorage();

// Initialize multer with the defined storage configuration
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
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
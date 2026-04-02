import multer from 'multer';

// Use memory storage to keep the file in memory as a Buffer for MongoDB
const storage = multer.memoryStorage();

// Initialize multer with the defined storage configuration
const upload = multer({
    storage: storage,
    limits: { fileSize: 16 * 1024 * 1024 }, // Increased to 16MB (max BSON size)
});

export default upload;
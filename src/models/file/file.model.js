import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    directory: { type: String, default: 'public' }
}, { timestamps: true });

const FileModel = mongoose.model('File', fileSchema);

export default FileModel;
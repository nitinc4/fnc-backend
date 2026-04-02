import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    directory: { type: String, default: 'public' },
    // --- NEW: Link the file to the User who uploaded it ---
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    description: { type: String, default: '' }
}, { timestamps: true });

const FileModel = mongoose.model('File', fileSchema);

export default FileModel;
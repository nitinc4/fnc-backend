import httpStatus from '../../utils/http-status.js';
import { File as FileModel } from '../../models/file/file.model.js';
import path from 'path';

/**
 * File Controller with MongoDB Binary Storage Support (Persistent on Render)
 */
const FileController = {
  add: async (req, res, next) => {
    try {
      const { name, directory, description, userId } = req.body;
      let filePath = req.body.path; 

      if (req.file && req.file.buffer) {
         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
         const originalName = req.file.originalname.replace(/\s+/g, '_');
         filePath = `db-uploads/${uniqueSuffix}-${originalName}`;
      }

      if (!filePath && !req.file) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'No file path or file uploaded',
        });
      }

      // Consistent sanitization for the name field used in search
      const finalName = name 
        ? name.replace(/\s+/g, '_') 
        : (req.file ? req.file.originalname.replace(/\s+/g, '_') : path.basename(filePath));

      const fileData = {
        path: filePath,
        name: finalName,
        directory: directory || 'public',
        contentType: req.file ? req.file.mimetype : 'application/octet-stream',
        description: description || '',
        user: userId || (req.user ? req.user._id : null),
        media: req.file ? req.file.buffer : null, // The actual binary content
      };

      const fileRecord = new FileModel(fileData);
      const savedFile = await fileRecord.save();

      return res.status(httpStatus.CREATED).json({
        success: true,
        data: savedFile,
      });
    } catch (error) {
      next(error);
    }
  },

  list: async (req, res, next) => {
    try {
      const { userId } = req.query;
      const query = userId ? { user: userId } : {};
      
      // Exclude media from the listing for performance (only needs metadata)
      const files = await FileModel.find(query)
        .select('-media') 
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
      
      return res.status(httpStatus.OK).json({
        success: true,
        data: files,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Serves the media from MongoDB Buffer instead of the filesystem.
   */
  view: async (req, res, next) => {
    try {
      const { filename } = req.params;
      
      // Sanitised version for lookup (replaces spaces/plus with underscores to match DB sanitisation)
      const sanitised = filename.replace(/[\s\+]+/g, '_');
      
      // Try to find by name, sanitised name, or as a suffix of the path
      let file = await FileModel.findOne({ 
        $or: [
          { name: filename },
          { name: sanitised },
          { path: filename },
          { path: { $regex: filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$' } },
          { path: { $regex: sanitised.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$' } }
        ]
      });

      if (!file || !file.media) {
        console.log(`[FileView] File not found in DB: ${filename} (sanitised: ${sanitised})`);
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: 'File or Media not found in Database',
        });
      }

      // Stream binary from MongoDB with correct headers
      res.set('Content-Type', file.contentType || 'application/octet-stream');
      return res.send(file.media);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { pathname } = req.body;

      let file;
      if (id) {
        file = await FileModel.findById(id);
      } else if (pathname) {
        file = await FileModel.findOne({ path: pathname });
      }

      if (!file) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: 'File record not found',
        });
      }

      await FileModel.findByIdAndDelete(file._id);

      return res.status(httpStatus.OK).json({
        success: true,
        message: 'File deleted from database successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

export default FileController;

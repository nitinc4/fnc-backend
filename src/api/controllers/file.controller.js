import httpStatus from 'http-status';
import { File as FileModel } from '../../models/file/file.model';
import path from 'path';
import fs from 'fs';

const FileController = {
  add: async (req, res, next) => {
    try {
      const { name, directory, description, userId } = req.body;
      let filePath = req.body.path; // For manual URL entry

      if (req.file) {
        filePath = `public/uploads/${req.file.filename}`;
      }

      if (!filePath) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'No file path or file uploaded',
        });
      }

      const fileData = {
        path: filePath,
        name: name || (req.file ? req.file.originalname : path.basename(filePath)),
        directory: directory || 'public',
        contentType: req.file ? req.file.mimetype : 'application/octet-stream',
        description: description || '',
        user: userId || (req.user ? req.user._id : null),
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
      const files = await FileModel.find(query).populate('user', 'name email').sort({ createdAt: -1 });
      
      return res.status(httpStatus.OK).json({
        success: true,
        data: files,
      });
    } catch (error) {
      next(error);
    }
  },

  view: async (req, res, next) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'public/uploads', filename);

      if (!fs.existsSync(filePath)) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: 'File not found',
        });
      }

      return res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params; // Admin uses ID
      const { pathname } = req.body; // Flutter uses pathname

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

      // Delete physical file if it exists in public/uploads
      if (file.path.startsWith('public/uploads/')) {
        const physicalPath = path.join(process.cwd(), file.path);
        if (fs.existsSync(physicalPath)) {
          fs.unlinkSync(physicalPath);
        }
      }

      await FileModel.findByIdAndDelete(file._id);

      return res.status(httpStatus.OK).json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

export default FileController;

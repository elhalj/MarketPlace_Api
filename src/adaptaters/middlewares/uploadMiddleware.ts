import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ValidationError } from './errorHandler';

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf'
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const name = file.originalname.toLowerCase().split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    cb(null, `${name}_${Date.now()}.${extension}`);
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!MIME_TYPES[file.mimetype]) {
    cb(new ValidationError('Invalid file type'));
  } else {
    cb(null, true);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ValidationError('File size too large'));
        }
        return next(new ValidationError(err.message));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

// Middleware for multiple files upload
export const uploadMultiple = (fieldName: string, maxCount: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.array(fieldName, maxCount)(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ValidationError('File size too large'));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new ValidationError(`Too many files. Maximum allowed is ${maxCount}`));
        }
        return next(new ValidationError(err.message));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

// Middleware for multiple fields upload
export const uploadFields = (fields: { name: string; maxCount: number }[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.fields(fields)(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ValidationError('File size too large'));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new ValidationError('Too many files'));
        }
        return next(new ValidationError(err.message));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

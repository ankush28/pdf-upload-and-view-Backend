import multer from 'multer';
import path from 'path';
import * as fs from 'fs';
import { NextFunction, Request, Response } from 'express';
import util from 'util';

export const uploadDirectory = path.join(__dirname, "../", "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

export const unlinkAsync = util.promisify(fs.unlink);

const sanitizeFileName = (fileName: string) => {
  return fileName.replace(/[^a-zA-Z0-9.]/g, '_');
};

const generateUniqueFileName = (fileName: string) => {
  const ext = path.extname(fileName);
  const baseName = path.basename(fileName, ext);
  let uniqueName = fileName;
  let counter = 1;

  while (fs.existsSync(path.join(uploadDirectory, uniqueName))) {
    uniqueName = `${baseName}_${counter}${ext}`;
    counter++;
  }
  return uniqueName;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const sanitizedFileName = sanitizeFileName(file.originalname);
    const uniqueFileName = generateUniqueFileName(sanitizedFileName);
    cb(null, uniqueFileName);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only jpeg, png, gif, and webp formats are allowed!'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
}).array('files', 5);

export const updateFilesMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];

    for (const file of files) {
      const originalPath = file.path;
      const sanitizedFileName = sanitizeFileName(file.originalname);
      const uniqueFileName = generateUniqueFileName(sanitizedFileName);
      const newPath = path.join(uploadDirectory, uniqueFileName);
      await fs.promises.copyFile(originalPath, newPath);
    }

    next();
  } catch (error) {
    console.error('Error updating files:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

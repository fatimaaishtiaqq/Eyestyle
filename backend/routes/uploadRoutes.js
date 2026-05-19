import path from 'path';
import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = express.Router();

const hasCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'luxury-ecommerce/uploads',
        format: async (req, file) => {
            // Extract extension without dot and lowercase it
            let ext = path.extname(file.originalname).substring(1).toLowerCase();
            if (ext === 'jpeg') ext = 'jpg';
            // Default to png if unknown, else use original extension
            const validFormats = ['jpg', 'png', 'webp', 'mp4', 'webm'];
            return validFormats.includes(ext) ? ext : 'png';
        },
        public_id: (req, file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            // File basename without ext
            const name = path.basename(file.originalname, path.extname(file.originalname));
            return `${file.fieldname}-${name}-${uniqueSuffix}`;
        },
    },
});

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp|mp4|webm/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Images and Videos only!'));
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 5 },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

// @desc    Upload multiple files (authenticated users — reviews, admin products)
// @route   POST /api/upload
// @access  Private
router.post('/', protect, (req, res, next) => {
    if (!hasCloudinary) {
        return res.status(503).json({ message: 'Image upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.' });
    }
    upload.array('images', 5)(req, res, (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({ message: err.message || 'Upload failed' });
        }
        next();
    });
}, (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        // Return the Cloudinary secure URLs directly
        const filePaths = req.files.map(file => {
            if (!file || !file.path) return '';
            return file.path; // multer-storage-cloudinary sets file.path to the secure_url
        }).filter(p => typeof p === 'string' && p.trim() !== '');

        if (filePaths.length === 0) {
            return res.status(500).json({ message: 'Upload to storage failed' });
        }

        res.json({
            message: 'Files Uploaded Successfully to Cloudinary',
            images: filePaths,
        });
    } catch (err) {
        console.error('Upload handler error:', err);
        res.status(500).json({ message: 'Upload failed' });
    }
});

export default router;

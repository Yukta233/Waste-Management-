import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/ApiError.js';

// Ensure uploads directory exists
const ensureUploadsDir = () => {
    const uploadDir = './public/temp'; // Changed to match your Cloudinary cleanup
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
};

// Configure local storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = ensureUploadsDir();
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname).toLowerCase();
        const fileName = file.fieldname + '-' + uniqueSuffix + fileExt;
        cb(null, fileName);
    }
});

// File filter for image validation
const imageFileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
        // Removed 'image/svg+xml' - SVG is not typically uploaded to Cloudinary
    ];
    
    const allowedExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.webp'];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExt)) {
        cb(null, true);
    } else {
        cb(new ApiError(400, `Invalid file type. Only ${allowedExtensions.join(', ')} files are allowed.`), false);
    }
};

// File filter for document validation
const documentFileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];
    
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpeg', '.jpg', '.png'];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExt)) {
        cb(null, true);
    } else {
        cb(new ApiError(400, `Invalid document type. Only ${allowedExtensions.join(', ')} files are allowed.`), false);
    }
};

// File size limits
const limits = {
    fileSize: 5 * 1024 * 1024, // Reduced to 5MB (Cloudinary recommends < 10MB)
    files: 10 // Max 10 files per upload
};

// Create multer instances
const upload = multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: limits
});

const uploadDocuments = multer({
    storage: storage,
    fileFilter: documentFileFilter,
    limits: limits
});

// Single file upload for profile photos
const uploadProfilePhoto = upload.single('profilePhoto');

// Single file upload for service images
const uploadServiceImage = upload.single('image');

// Multiple files upload for service images
const uploadServiceImages = upload.array('images', 5); // Max 5 images

// Multiple files upload for verification documents
const uploadVerificationDocuments = uploadDocuments.array('documents', 5); // Max 5 documents

// Middleware to handle upload errors
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer-specific errors
        let message = 'File upload error';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = `File too large. Maximum size is ${limits.fileSize / (1024 * 1024)}MB`;
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = `Too many files. Maximum is ${limits.files} files`;
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Unexpected file field';
        }
        return next(new ApiError(400, message));
    } else if (err) {
        // Other errors (including our ApiError)
        return next(err);
    }
    next();
};

// Cleanup temporary files middleware
const cleanupTempFiles = (req, res, next) => {
    // Cleanup files after response is sent
    res.on('finish', function() {
        if (req.file) {
            // Handle single file
            if (req.file.path && fs.existsSync(req.file.path)) {
                try {
                    fs.unlinkSync(req.file.path);
                    console.log('🗑️ Cleaned up temp file:', req.file.path);
                } catch (error) {
                    console.error('❌ Error deleting temp file:', error.message);
                }
            }
        }
        
        if (req.files) {
            // Handle multiple files
            const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
            files.forEach(file => {
                if (file.path && fs.existsSync(file.path)) {
                    try {
                        fs.unlinkSync(file.path);
                        console.log('🗑️ Cleaned up temp file:', file.path);
                    } catch (error) {
                        console.error('❌ Error deleting temp file:', error.message);
                    }
                }
            });
        }
    });
    next();
};

// Utility function to get file metadata
const getFileMetadata = (file) => {
    return {
        originalName: file.originalname,
        fileName: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        extension: path.extname(file.originalname).toLowerCase()
    };
};

// Utility function to validate file size
const validateFileSize = (file, maxSizeMB = 5) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        throw new ApiError(400, `File ${file.originalname} is too large. Maximum size is ${maxSizeMB}MB`);
    }
    return true;
};

// Export middleware functions
export {
    upload,
    uploadDocuments,
    uploadProfilePhoto,
    uploadServiceImage,
    uploadServiceImages,
    uploadVerificationDocuments,
    handleUploadError,
    cleanupTempFiles,
    getFileMetadata,
    validateFileSize
};

// Default export for backward compatibility
export default upload;
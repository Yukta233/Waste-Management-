import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/ApiError.js';

// Ensure uploads directory exists
const ensureUploadsDir = () => {
    const uploadDir = 'uploads';
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
        'image/webp',
        'image/svg+xml'
    ];
    
    const allowedExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'];
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
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10 // Max 10 files per upload
};

// Configure multer instances for different use cases
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

// Mixed upload (images + documents)
const uploadMixed = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Check if file is image
        if (file.mimetype.startsWith('image/')) {
            return imageFileFilter(req, file, cb);
        }
        // Check if file is document
        else if (file.mimetype.includes('pdf') || file.mimetype.includes('word')) {
            return documentFileFilter(req, file, cb);
        }
        // Reject other types
        else {
            cb(new ApiError(400, 'Only image and document files are allowed'), false);
        }
    },
    limits: limits
}).fields([
    { name: 'images', maxCount: 5 },
    { name: 'documents', maxCount: 5 }
]);

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
        // Other errors
        return next(err);
    }
    next();
};

// Cleanup temporary files middleware
const cleanupTempFiles = (req, res, next) => {
    // Cleanup files after response is sent
    res.on('finish', () => {
        if (req.files) {
            const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
            files.forEach(file => {
                if (file.path && fs.existsSync(file.path)) {
                    try {
                        fs.unlinkSync(file.path);
                    } catch (error) {
                        console.error('Error deleting temp file:', error.message);
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
const validateFileSize = (file, maxSizeMB = 10) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        throw new ApiError(400, `File ${file.originalname} is too large. Maximum size is ${maxSizeMB}MB`);
    }
    return true;
};

// Utility function to validate image dimensions (optional)
const validateImageDimensions = async (filePath, minWidth = 100, minHeight = 100) => {
    // This requires sharp or similar library
    // Install: npm install sharp
    try {
        const sharp = await import('sharp');
        const metadata = await sharp.default(filePath).metadata();
        
        if (metadata.width < minWidth || metadata.height < minHeight) {
            throw new ApiError(400, `Image dimensions too small. Minimum ${minWidth}x${minHeight}px required`);
        }
        return metadata;
    } catch (error) {
        // If sharp is not installed or error, skip dimension validation
        console.warn('Image dimension validation skipped:', error.message);
        return null;
    }
};

// Generate thumbnail (optional - requires sharp)
const generateThumbnail = async (filePath, width = 300, height = 300) => {
    try {
        const sharp = await import('sharp');
        const thumbnailPath = filePath.replace(path.extname(filePath), `_thumb${path.extname(filePath)}`);
        
        await sharp.default(filePath)
            .resize(width, height, { fit: 'cover' })
            .toFile(thumbnailPath);
        
        return thumbnailPath;
    } catch (error) {
        console.error('Thumbnail generation failed:', error.message);
        return null;
    }
};

// Middleware to process uploaded images (resize, optimize)
const processUploadedImages = async (req, res, next) => {
    try {
        if (!req.files) return next();
        
        const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        
        for (const file of files) {
            if (file.mimetype.startsWith('image/')) {
                // Validate dimensions if needed
                // await validateImageDimensions(file.path, 300, 300);
                
                // Generate thumbnail if needed
                // const thumbnailPath = await generateThumbnail(file.path);
                // file.thumbnailPath = thumbnailPath;
                
                // Add metadata to request
                file.metadata = getFileMetadata(file);
            }
        }
        
        next();
    } catch (error) {
        next(error);
    }
};

// Export middleware functions
export {
    upload,
    uploadDocuments,
    uploadProfilePhoto,
    uploadServiceImage,
    uploadServiceImages,
    uploadVerificationDocuments,
    uploadMixed,
    handleUploadError,
    cleanupTempFiles,
    processUploadedImages,
    getFileMetadata,
    validateFileSize
};

// Default export for backward compatibility
export default upload;
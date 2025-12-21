import express from 'express';
import { 
    getCurrentUser,
    updateAccountDetails,
    updateProfilePhoto,
    updateVerificationDocuments,
    getUserProfile,
    getServiceProviders
} from '../controllers/user.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { uploadProfilePhoto, handleUploadError, upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// ============ PUBLIC ROUTES ============
// Providers/Experts directory MUST be defined BEFORE dynamic :userId
router.get('/providers/list', getServiceProviders);
// Public user profile (for service providers)
router.get('/:userId', getUserProfile);

// ============ PROTECTED ROUTES ============
router.use(verifyJWT); // All routes below require authentication

// User profile
router.get('/profile', getCurrentUser);
router.put('/profile', updateAccountDetails);

// Profile photo
router.patch(
    '/profile/photo',
    uploadProfilePhoto,
    handleUploadError,
    updateProfilePhoto
);

// Verification documents (for experts/providers)
router.post(
    '/verification/documents',
    upload.array('documents', 5),
    handleUploadError,
    updateVerificationDocuments
);

export default router;

import express from 'express';

import {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService,
    getServicesByProvider,
    updateServiceStatus
} from '../controllers/service.controller.js';
import { verifyJWT, requireAdmin } from '../middleware/auth.middleware.js';
import { uploadServiceImages, handleUploadError } from '../middleware/upload.middleware.js';

const router = express.Router();

// ============ PUBLIC ROUTES ============
// Anyone can view services
router.get("/", getAllServices);
router.get("/provider/:providerId", getServicesByProvider);
router.get("/:serviceId", getServiceById);

// ============ PROTECTED ROUTES ============
router.use(verifyJWT); // All routes below require authentication

// Service CRUD operations (Experts/Providers/Admins only)
router.post(
    "/",
    uploadServiceImages,
    handleUploadError,
    createService
);

router.put(
    "/:serviceId",
    uploadServiceImages,
    handleUploadError,
    updateService
);

router.delete("/:serviceId", deleteService);

// ============ ADMIN ONLY ROUTES ============
router.patch(
    "/:serviceId/status",
    requireAdmin,
    updateServiceStatus
);

export default router;
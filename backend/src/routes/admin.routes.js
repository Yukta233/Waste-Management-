import express from 'express';
import { 
    getAllUsers,
    verifyUser,
    updateUserRole,
    getDashboardStats,
    getAllServicesForAdmin,
    getAllBookingsForAdmin
} from '../controllers/admin.controller.js';
import { verifyJWT, requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============ ADMIN ONLY ROUTES ============
router.use(verifyJWT, requireAdmin); // All routes require admin access

// User management
router.get("/users", getAllUsers);
router.patch("/users/:userId/verify", verifyUser);
router.patch("/users/:userId/role", updateUserRole);

// Service management
router.get("/services", getAllServicesForAdmin);

// Booking management
router.get("/bookings", getAllBookingsForAdmin);

// Dashboard statistics
router.get("/dashboard/stats", getDashboardStats);

export default router;
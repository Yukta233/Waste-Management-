import express from 'express';
import { 
    createBooking,
    getUserBookings,
    getProviderBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking
} from '../controllers/booking.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============ PROTECTED ROUTES ============
router.use(verifyJWT); // All routes below require authentication

// User bookings
router.post("/", createBooking);
router.get("/my-bookings", getUserBookings);
router.get("/:bookingId", getBookingById);

// Provider bookings
router.get("/provider/bookings", getProviderBookings);
router.patch("/:bookingId/status", updateBookingStatus);
router.patch("/:bookingId/cancel", cancelBooking);

export default router;
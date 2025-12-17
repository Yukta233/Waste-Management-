import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Booking } from "../models/Booking.model.js";
import { Service } from "../models/Service.model.js";
import { User } from "../models/User.model.js";

const createBooking = asyncHandler(async (req, res) => {
    const {
        serviceId,
        bookingDate,
        timeSlot,
        address,
        contactPerson,
        specialInstructions,
        requirements
    } = req.body;

    // Validate required fields
    if (!serviceId || !bookingDate || !timeSlot || !address || !contactPerson?.name || !contactPerson?.phone) {
        throw new ApiError(400, "Please provide all required booking details");
    }

    // Check if service exists and is available
    const service = await Service.findOne({
        _id: serviceId,
        status: 'active',
        isAvailable: true
    });

    if (!service) {
        throw new ApiError(404, "Service not found or not available");
    }

    // Check if provider is available on the requested date
    // (You can implement more sophisticated availability checking)

    // normalize address to string when frontend may send an object
    function normalizeToString(v) {
        if (v == null) return '';
        if (typeof v === 'string') return v;
        if (typeof v === 'number' || typeof v === 'boolean') return String(v);
        if (typeof v === 'object') {
            if (v.address && typeof v.address === 'string') return v.address;
            if (v.line1 && typeof v.line1 === 'string') return v.line1;
            if (v.street && typeof v.street === 'string') return v.street;
            // join primitive values
            try {
                return Object.values(v).flatMap(x => (x == null ? [] : (typeof x === 'object' ? Object.values(x) : [x]))).filter(Boolean).map(s => String(s)).join(', ');
            } catch (e) {
                return JSON.stringify(v);
            }
        }
        return String(v);
    }

    function normalizeLocation(loc) {
        if (!loc) return { address: '', city: '', state: '', pincode: '', coordinates: {} };
        return {
            address: normalizeToString(loc.address || loc),
            city: normalizeToString(loc.city),
            state: normalizeToString(loc.state),
            pincode: normalizeToString(loc.pincode),
            coordinates: (loc.coordinates && typeof loc.coordinates === 'object') ? {
                lat: loc.coordinates.lat || loc.coordinates?.lat || undefined,
                lng: loc.coordinates.lng || loc.coordinates?.lng || undefined
            } : {}
        };
    }

    // Calculate total amount
    const totalAmount = service.price;

    // Create booking
    const booking = await Booking.create({
        user: req.user._id,
        service: serviceId,
        provider: service.provider,
        bookingDate: new Date(bookingDate),
        timeSlot,
        address: normalizeToString(address) || normalizeToString(service.location) || '',
        location: normalizeLocation(req.body.location) || normalizeLocation(service.location),
        contactPerson,
        specialInstructions,
        requirements,
        basePrice: service.price,
        totalAmount,
        status: 'pending'
    });

    // Increment service bookings count and mark service unavailable to others
    await Service.findByIdAndUpdate(serviceId, {
        $inc: { bookingsCount: 1 },
        $set: { isAvailable: false, bookedBy: req.user._id, bookedAt: new Date() }
    });

    // Add booking to user's bookings
    await User.findByIdAndUpdate(req.user._id, {
        $push: { bookingsMade: booking._id }
    });

    // Populate booking details for response
    const populatedBooking = await Booking.findById(booking._id)
        .populate('service', 'title description price category')
        .populate('provider', 'fullName phoneNumber email');

    return res
        .status(201)
        .json(
            new ApiResponse(201, populatedBooking, "Booking created successfully")
        );
});

const getUserBookings = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: req.user._id };
    
    if (status) {
        filter.status = status;
    }

    const bookings = await Booking.find(filter)
        .populate('service', 'title category price images')
        .populate('provider', 'fullName profilePhoto phoneNumber')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    bookings,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                },
                "User bookings fetched successfully"
            )
        );
});

const getProviderBookings = asyncHandler(async (req, res) => {
    // Only experts and providers can access
    if (!req.user.isExpert() && !req.user.isProvider() && !req.user.isAdmin()) {
        throw new ApiError(403, "Only service providers can access this");
    }

    const { status, page = 1, limit = 10 } = req.query;

    const filter = { provider: req.user._id };
    
    if (status) {
        filter.status = status;
    }

    const bookings = await Booking.find(filter)
        .populate('service', 'title category')
        .populate('user', 'fullName profilePhoto phoneNumber email')
        .sort({ bookingDate: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    bookings,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                },
                "Provider bookings fetched successfully"
            )
        );
});

const getBookingById = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
        .populate('service', 'title description price category images specifications')
        .populate('user', 'fullName profilePhoto phoneNumber email address')
        .populate('provider', 'fullName profilePhoto phoneNumber email expertise');

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    // Check if user has permission to view this booking
    const isOwner = booking.user._id.equals(req.user._id);
    const isProvider = booking.provider._id.equals(req.user._id);
    const isAdmin = req.user.isAdmin();

    if (!isOwner && !isProvider && !isAdmin) {
        throw new ApiError(403, "You are not authorized to view this booking");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, booking, "Booking details fetched successfully")
        );
});

const updateBookingStatus = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { status, providerNotes } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    // Check if user is the provider or admin
    if (!booking.provider.equals(req.user._id) && !req.user.isAdmin()) {
        throw new ApiError(403, "Only the service provider can update booking status");
    }

    // Validate status transition
    const allowedTransitions = {
        'pending': ['confirmed', 'rejected'],
        'confirmed': ['scheduled', 'cancelled'],
        'scheduled': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': [],
        'rejected': []
    };

    if (!allowedTransitions[booking.status]?.includes(status)) {
        throw new ApiError(400, `Cannot change status from ${booking.status} to ${status}`);
    }

    // Update booking
    booking.status = status;
    
    if (providerNotes) {
        booking.providerNotes = providerNotes;
    }
    
    if (status === 'completed') {
        booking.completedAt = new Date();
    }

    await booking.save();

    // Notify user about status change (you can implement email/notification here)

    return res
        .status(200)
        .json(
            new ApiResponse(200, booking, `Booking status updated to ${status}`)
        );
});

const cancelBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { cancellationReason } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    // Check if user is allowed to cancel
    const isOwner = booking.user._id.equals(req.user._id);
    const isProvider = booking.provider.equals(req.user._id);
    const isAdmin = req.user.isAdmin();

    if (!isOwner && !isProvider && !isAdmin) {
        throw new ApiError(403, "You are not authorized to cancel this booking");
    }

    // Check if booking can be cancelled
    if (!booking.canBeCancelled()) {
        throw new ApiError(400, "This booking cannot be cancelled at this time");
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancelledBy = isOwner ? 'user' : (isProvider ? 'provider' : 'admin');
    booking.cancellationReason = cancellationReason;
    booking.cancellationTime = new Date();

    await booking.save();
    // If this booking had reserved the service, make it available again
    try {
        if (booking.service) {
            await Service.findByIdAndUpdate(booking.service, {
                $set: { isAvailable: true },
                $unset: { bookedBy: "", bookedAt: "" }
            });
        }
    } catch (e) {
        // Log but don't block cancellation response
        console.error('Failed to update service availability on cancellation', e);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, booking, "Booking cancelled successfully")
        );
});

export {
    createBooking,
    getUserBookings,
    getProviderBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking
};
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.model.js";
import { Service } from "../models/Service.model.js";
import { Booking } from "../models/Booking.model.js";


const getAllUsers = asyncHandler(async (req, res) => {
    const { 
        role, 
        isVerified, 
        verificationStatus,
        page = 1, 
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    
    if (role) filter.role = role;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users
    const users = await User.find(filter)
        .select("-password -refreshToken -verificationDocuments")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments(filter);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    users,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                },
                "Users fetched successfully"
            )
        );
});

const verifyUser = asyncHandler(async (req, res) => {
    // ✅ REMOVED: Duplicate admin check (already done by requireAdmin middleware)
    const { userId } = req.params;
    const { status, remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        throw new ApiError(400, "Status must be either 'approved' or 'rejected'");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Only experts and providers can be verified
    if (!['expert', 'provider'].includes(user.role)) {
        throw new ApiError(400, "Only experts and providers can be verified");
    }

    // Update user verification status
    user.verificationStatus = status;
    user.isVerified = status === 'approved';
    
    if (remarks) {
        user.verificationRemarks = remarks;
    }

    await user.save();

    // If approved and has pending services, approve them too
    if (status === 'approved') {
        await Service.updateMany(
            { 
                provider: userId,
                status: 'pending'
            },
            { 
                status: 'active',
                isAvailable: true,
                approvedBy: req.user._id,
                approvedAt: new Date()
            }
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                `User verification ${status} successfully`
            )
        );
});

const updateUserRole = asyncHandler(async (req, res) => {
    // ✅ REMOVED: Duplicate admin check (already done by requireAdmin middleware)
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'expert', 'provider', 'user'];
    if (!validRoles.includes(role)) {
        throw new ApiError(400, "Invalid role specified");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Cannot change own role
    if (user._id.toString() === req.user._id.toString()) {
        throw new ApiError(400, "Cannot change your own role");
    }

    // Update role
    const oldRole = user.role;
    user.role = role;

    // Adjust verification status based on new role
    if (role === 'expert' || role === 'provider') {
        user.isVerified = false;
        user.verificationStatus = 'pending';
    } else if (role === 'user') {
        user.isVerified = true;
        user.verificationStatus = 'approved';
    }

    await user.save();

    // If changing from expert/provider to user, deactivate their services
    if ((oldRole === 'expert' || oldRole === 'provider') && role === 'user') {
        await Service.updateMany(
            { provider: userId },
            { 
                status: 'inactive',
                isAvailable: false
            }
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User role updated successfully")
        );
});

// ... rest of the file remains the same (getAllServicesForAdmin, getAllBookingsForAdmin, getDashboardStats)
const getAllServicesForAdmin = asyncHandler(async (req, res) => {
    const { 
        status, 
        category, 
        provider, 
        page = 1, 
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (provider) filter.provider = provider;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get services
    const services = await Service.find(filter)
        .populate('provider', 'fullName email role isVerified')
        .populate('approvedBy', 'fullName')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

    // Get total count
    const total = await Service.countDocuments(filter);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    services,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                },
                "Services fetched successfully"
            )
        );
});

const getAllBookingsForAdmin = asyncHandler(async (req, res) => {
    const { 
        status, 
        provider, 
        user,
        page = 1, 
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    
    if (status) filter.status = status;
    if (provider) filter.provider = provider;
    if (user) filter.user = user;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get bookings
    const bookings = await Booking.find(filter)
        .populate('service', 'title category price')
        .populate('user', 'fullName email phoneNumber')
        .populate('provider', 'fullName email phoneNumber')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

    // Get total count
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
                "Bookings fetched successfully"
            )
        );
});

const getDashboardStats = asyncHandler(async (req, res) => {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const totalExperts = await User.countDocuments({ role: 'expert' });
    const totalProviders = await User.countDocuments({ role: 'provider' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const pendingVerifications = await User.countDocuments({ 
        verificationStatus: 'pending',
        role: { $in: ['expert', 'provider'] }
    });

    // Get service statistics
    const totalServices = await Service.countDocuments();
    const activeServices = await Service.countDocuments({ status: 'active' });
    const pendingServices = await Service.countDocuments({ status: 'pending' });
    const rejectedServices = await Service.countDocuments({ status: 'rejected' });

    // Get booking statistics
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

    // Get revenue (sum of completed bookings)
    const revenueResult = await Booking.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Get recent activities
    const recentUsers = await User.find()
        .select('fullName email role createdAt')
        .sort({ createdAt: -1 })
        .limit(5);

    const recentServices = await Service.find()
        .select('title category status createdAt')
        .populate('provider', 'fullName')
        .sort({ createdAt: -1 })
        .limit(5);

    const recentBookings = await Booking.find()
        .select('status totalAmount createdAt')
        .populate('user', 'fullName')
        .populate('service', 'title')
        .sort({ createdAt: -1 })
        .limit(5);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    users: {
                        total: totalUsers,
                        experts: totalExperts,
                        providers: totalProviders,
                        admins: totalAdmins,
                        pendingVerifications
                    },
                    services: {
                        total: totalServices,
                        active: activeServices,
                        pending: pendingServices,
                        rejected: rejectedServices
                    },
                    bookings: {
                        total: totalBookings,
                        completed: completedBookings,
                        pending: pendingBookings,
                        cancelled: cancelledBookings,
                        revenue: totalRevenue
                    },
                    recentActivities: {
                        users: recentUsers,
                        services: recentServices,
                        bookings: recentBookings
                    }
                },
                "Dashboard statistics fetched successfully"
            )
        );
});

export {
    getAllUsers,
    verifyUser,
    updateUserRole,
    getAllServicesForAdmin,
    getAllBookingsForAdmin,
    getDashboardStats
};
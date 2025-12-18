import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.model.js";
import { Service } from "../models/Service.model.js";
import { uploadOnCloudinary as uploadImage } from "../config/cloudinary.js";

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select("-password -refreshToken -verificationDocuments")
        .populate({
            path: 'servicesOffered',
            select: 'title price category status',
            options: { limit: 5, sort: { createdAt: -1 } }
        })
        .populate({
            path: 'bookingsMade',
            select: 'status bookingDate totalAmount',
            populate: {
                path: 'service',
                select: 'title provider'
            },
            options: { limit: 5, sort: { createdAt: -1 } }
        });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User profile fetched successfully")
        );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {
        fullName,
        phoneNumber,
        bio,
        website,
        address,
        expertise,
        companyName,
        serviceArea
    } = req.body;

    // Build update object
    const updateFields = {};
    
    if (fullName) updateFields.fullName = fullName;
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    if (bio) updateFields.bio = bio;
    if (website) updateFields.website = website;
    if (companyName) updateFields.companyName = companyName;
    
    if (address) {
        try {
            updateFields.address = typeof address === 'string' 
                ? JSON.parse(address) 
                : address;
        } catch (error) {
            throw new ApiError(400, "Invalid address format");
        }
    }
    
    if (expertise) {
        updateFields.expertise = typeof expertise === 'string' 
            ? expertise.split(',').map(item => item.trim())
            : expertise;
    }
    
    if (serviceArea) {
        updateFields.serviceArea = typeof serviceArea === 'string'
            ? serviceArea.split(',').map(area => area.trim())
            : serviceArea;
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateFields },
        { new: true, runValidators: true }
    ).select("-password -refreshToken -verificationDocuments");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        );
});

const updateProfilePhoto = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "Profile photo file is required");
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImage(req.file.path);
    
    // Check if upload was successful
    if (!uploadResult) {
        throw new ApiError(400, "Error uploading profile photo");
    }

    // Get the URL from the Cloudinary response
    // Cloudinary returns an object with 'secure_url' or 'url' property
    const profilePhotoUrl = uploadResult.secure_url || uploadResult.url;
    
    if (!profilePhotoUrl) {
        throw new ApiError(400, "Error getting profile photo URL");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { profilePhoto: profilePhotoUrl } },
        { new: true }
    ).select("-password -refreshToken -verificationDocuments");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Profile photo updated successfully")
        );
});

const updateVerificationDocuments = asyncHandler(async (req, res) => {
    // Only experts and providers can upload verification documents
    if (!req.user.isExpert() && !req.user.isProvider()) {
        throw new ApiError(403, "Only experts and providers can upload verification documents");
    }

    if (!req.files || req.files.length === 0) {
        throw new ApiError(400, "At least one document is required");
    }

    // Upload documents to Cloudinary
    const uploadPromises = req.files.map(file => uploadImage(file.path));
    const uploadResults = await Promise.all(uploadPromises);
    
    // Extract URLs from upload results
    const documentUrls = uploadResults
        .filter(result => result) // Filter out null results
        .map(result => result.secure_url || result.url)
        .filter(url => url); // Filter out undefined URLs

    if (documentUrls.length === 0) {
        throw new ApiError(400, "Failed to upload documents");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { 
            $push: { verificationDocuments: { $each: documentUrls } },
            $set: { verificationStatus: 'pending' }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Verification documents uploaded successfully")
        );
});

const getUserProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId)
        .select("-password -refreshToken -verificationDocuments")
        .populate({
            path: 'servicesOffered',
            match: { status: 'active', isAvailable: true },
            select: 'title description price category images ratings',
            options: { limit: 10, sort: { createdAt: -1 } }
        })
        .populate({
            path: 'reviewsReceived',
            select: 'rating comment createdAt',
            populate: {
                path: 'user',
                select: 'fullName profilePhoto'
            },
            options: { limit: 5, sort: { createdAt: -1 } }
        });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Only show active services for public viewing
    const publicUser = user.toObject();
    
    // Hide certain fields for non-active users
    if (!user.isActive) {
        publicUser.servicesOffered = [];
        publicUser.bio = "This account is currently inactive";
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, publicUser, "User profile fetched successfully")
        );
});

const getServiceProviders = asyncHandler(async (req, res) => {
    const { city, expertise, minRating = 0, verified = true } = req.query;
    
    // Build filter for experts and providers
    let filter = {
        role: { $in: ['expert', 'provider'] },
        isActive: true
    };

    if (city) {
        filter['address.city'] = new RegExp(city, 'i');
    }

    if (expertise) {
        filter.expertise = { $in: [expertise] };
    }

    if (minRating) {
        filter.averageRating = { $gte: parseFloat(minRating) };
    }

    if (verified === 'true') {
        filter.isVerified = true;
        filter.verificationStatus = 'approved';
    }

    const providers = await User.find(filter)
        .select("-password -refreshToken -verificationDocuments -bookingsMade -reviewsGiven")
        .populate({
            path: 'servicesOffered',
            match: { status: 'active', isAvailable: true },
            select: 'title category price',
            options: { limit: 3 }
        })
        .sort({ 
            isVerified: -1, 
            averageRating: -1, 
            createdAt: -1 
        })
        .limit(20);

    return res
        .status(200)
        .json(
            new ApiResponse(200, providers, "Service providers fetched successfully")
        );
});

// Additional helper function for registration (if needed elsewhere)
const handleProfilePhotoUpload = async (file) => {
    if (!file || !file.path) {
        return "";
    }
    
    const uploadResult = await uploadImage(file.path);
    return uploadResult?.secure_url || uploadResult?.url || "";
};

export {
    getCurrentUser,
    updateAccountDetails,
    updateProfilePhoto,
    updateVerificationDocuments,
    getUserProfile,
    getServiceProviders,
    handleProfilePhotoUpload // Export if needed in auth controller
};
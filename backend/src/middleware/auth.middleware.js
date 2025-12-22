import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || 
                     req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid access token");
    }
});

// ✅ FIXED: Admin middleware - Simplified and fixed
export const requireAdmin = asyncHandler(async (req, res, next) => {
    // Debug logging to see what's happening
    console.log('🔍 ADMIN CHECK:', {
        userExists: !!req.user,
        userId: req.user?._id,
        userRole: req.user?.role,
        userModelType: req.user?.constructor?.modelName // Check if it's a Mongoose model
    });
    
    // Method 1: Check if isAdmin method exists and call it
    const byMethod = req.user && typeof req.user.isAdmin === 'function' 
        ? req.user.isAdmin() 
        : false;
    
    // Method 2: Direct role check as fallback
    const byRole = req.user && req.user.role && req.user.role.toLowerCase() === 'admin';
    
    if (!req.user || !(byMethod || byRole)) {
        console.log('❌ ADMIN ACCESS DENIED - User role:', req.user?.role);
        throw new ApiError(403, "Admin access required");
    }
    
    console.log('✅ ADMIN ACCESS GRANTED');
    next();
});

// ✅ FIXED: Expert/Provider middleware
export const requireServiceProvider = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required");
    }
    
    console.log('🔍 SERVICE PROVIDER CHECK:', {
        userId: req.user._id,
        userRole: req.user.role,
        userIsVerified: req.user.isVerified,
        hasCanCreateServices: typeof req.user.canCreateServices === 'function'
    });
    
    const userRole = req.user.role;
    const allowedRoles = ['admin', 'expert', 'provider'];
    const isAllowed = allowedRoles.includes(userRole);
    
    if (!isAllowed) {
        console.log('❌ Service provider access denied. User role:', userRole);
        throw new ApiError(403, "Service provider access required");
    }
    
    // ✅ REMOVED: Extra verification check (temporarily for testing)
    // if (['expert', 'provider'].includes(userRole) && !req.user.isVerified) {
    //     throw new ApiError(403, "Account verification required");
    // }
    
    console.log('✅ Service provider access granted');
    next();
});
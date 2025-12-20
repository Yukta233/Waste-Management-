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
        // Normalize JWT errors to a consistent 401 without leaking internal details
        throw new ApiError(401, "Invalid access token");
    }
});

// Admin middleware
export const requireAdmin = asyncHandler(async (req, res, next) => {
    // Be robust to user documents that may not have instance methods or have role casing issues
    const role = req.user?.role;
    const byMethod = typeof req.user?.isAdmin === 'function' ? req.user.isAdmin() : false;
    const byRole = typeof role === 'string' && role.toLowerCase() === 'admin';

    if (!req.user || !(byMethod || byRole)) {
        throw new ApiError(403, "Admin access required");
    }
    next();
});

// Expert/Provider middleware
export const requireServiceProvider = asyncHandler(async (req, res, next) => {
    if (!req.user || (!req.user.isExpert() && !req.user.isProvider() && !req.user.isAdmin())) {
        throw new ApiError(403, "Service provider access required");
    }
    next();
});
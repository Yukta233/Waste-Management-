import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.model.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary as uploadImage } from "../config/cloudinary.js";
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const {
        fullName,
        email,
        password,
        phoneNumber,
        role = 'user',
        expertise,
        companyName,
        address,
        bio
    } = req.body;

    // Validation
    if (!fullName || !email || !password) {
        throw new ApiError(400, "Full name, email, and password are required");
    }


     let profilePhotoUrl = "";
    if (req.file) {
        console.log('🖼️ Attempting to upload profile photo...');
        console.log('📁 File path:', req.file.path);
        console.log('📁 File exists?', fs.existsSync(req.file.path));
        
        try {
            const uploadResult = await uploadImage(req.file.path);
            console.log('☁️ Cloudinary upload result:', uploadResult);
            
            if (uploadResult && uploadResult.url) {
                profilePhotoUrl = uploadResult.url;
                console.log('✅ Photo uploaded successfully:', profilePhotoUrl);
                
                // ✅ Delete the local file after successful upload
                try {
                    fs.unlinkSync(req.file.path);
                    console.log('🗑️ Local file deleted successfully');
                } catch (deleteError) {
                    console.error('❌ Error deleting local file:', deleteError.message);
                }
            } else {
                console.log('❌ Cloudinary upload failed or returned no URL');
            }
        } catch (error) {
            console.error('❌ Error uploading profile photo:', error.message);
            console.error('❌ Full error:', error);
        }
    } else {
        console.log('❌ No file in request');
        console.log('❌ Request files:', req.files);
        console.log('❌ Request file:', req.file);
    }

    // ... rest of your code ...
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // Validate role
    const validRoles = ['admin', 'expert', 'provider', 'user'];
    if (!validRoles.includes(role)) {
        throw new ApiError(400, "Invalid user role");
    }

    // Parse expertise if provided
    let expertiseArray = [];
    if (expertise) {
        expertiseArray = typeof expertise === 'string' 
            ? expertise.split(',').map(item => item.trim())
            : expertise;
    }

    // Set verification status based on role
    let isVerified = false;
    let verificationStatus = 'pending';
    
    if (role === 'user') {
        isVerified = true;
        verificationStatus = 'approved';
    } else if (role === 'expert' || role === 'provider') {
        isVerified = false;
        verificationStatus = 'pending';
    }

    // Create user
    const user = await User.create({
        fullName,
        email: email.toLowerCase(),
        password,
        phoneNumber,
        role,
        expertise: expertiseArray,
        companyName,
        address: address || {},
        bio,
        profilePhoto: profilePhotoUrl, // ADD THIS LINE
        isVerified,
        verificationStatus
    });

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Get user without sensitive data
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -verificationDocuments"
    );

    // Set cookies
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                201,
                {
                    user: createdUser,
                    accessToken,
                    refreshToken
                },
                "User registered successfully"
            )
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if account is active
    if (!user.isActive) {
        throw new ApiError(403, "Account is deactivated. Please contact support.");
    }

    // Check password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Get user without sensitive data
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -verificationDocuments"
    );

    // Set cookies
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 }
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        };

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});
const cleanupLocalFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log('🗑️ Cleaned up local file:', filePath);
        } catch (error) {
            console.error('❌ Error cleaning up file:', error.message);
        }
    }
};
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Both old and new passwords are required");
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
    }

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password changed successfully")
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    generateAccessAndRefreshTokens,
    cleanupLocalFile
};
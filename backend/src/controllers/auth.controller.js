import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.model.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary as uploadImage } from "../config/cloudinary.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
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

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  console.log('📧 Forgot password request for:', email);

  // Validate email
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required"
    });
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    console.log('❌ User not found for email:', email);
    return res.status(200).json({
      success: true,
      message: "If your email is registered, you will receive a password reset link shortly."
    });
  }

  console.log('✅ User found:', user._id, user.email);

  try {
    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    console.log('🔑 Generated reset token (plain):', resetToken);
    console.log('🔑 Generated reset token (hashed):', hashedToken);
    console.log('⏰ Expiry time:', new Date(Date.now() + 15 * 60 * 1000).toISOString());

    // Update user with token and expiry
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes from now
    
    await user.save({ validateBeforeSave: false });
    
    console.log('✅ Token saved to database');
    console.log('✅ User after save:', {
      resetPasswordToken: user.resetPasswordToken,
      resetPasswordExpire: user.resetPasswordExpire
    });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log('🔗 Reset URL:', resetUrl);

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify email configuration
    await transporter.verify();
    console.log('✅ Email server verified');

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Password Reset Request - WasteCare",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p>Hello <strong>${user.fullName}</strong>,</p>
          <p>Click the link below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p><strong>This link expires in 15 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">WasteCare Support</p>
        </div>
      `,
      text: `Reset your password: ${resetUrl}\nExpires in 15 minutes.`
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', info.messageId);

    return res.status(200).json({
      success: true,
      message: "Password reset link sent to your email.",
      // For debugging only - remove in production
      debug: process.env.NODE_ENV === 'development' ? { 
        resetUrl,
        tokenLength: resetToken.length,
        expiry: user.resetPasswordExpire 
      } : undefined
    });

  } catch (error) {
    console.error('❌ Error in forgot password:', error);
    
    // Clean up on error
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: "Failed to process request. Please try again later.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  console.log('🔄 Reset password attempt with token length:', token?.length);
  console.log('🔄 Raw token from URL:', token);
  console.log('🔄 Current time:', new Date().toISOString());

  if (!password || password.length < 6) {
    return res.status(400).json({ 
      success: false,
      message: "Password must be at least 6 characters long" 
    });
  }

  if (!token || token.length !== 64) { // 32 bytes hex = 64 characters
    console.log('❌ Invalid token length');
    return res.status(400).json({ 
      success: false,
      message: "Invalid reset token format" 
    });
  }

  // Hash the token to compare with stored one
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  console.log('🔑 Hashed token for comparison:', hashedToken);

  try {
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() } // Check if expiry is in future
    });

    if (!user) {
      console.log('❌ No user found with this token or token expired');
      
      // Let's check if token exists but is expired
      const expiredUser = await User.findOne({
        resetPasswordToken: hashedToken
      });
      
      if (expiredUser) {
        console.log('⏰ Token found but expired:', expiredUser.resetPasswordExpire);
        console.log('⏰ Current time:', new Date().toISOString());
        console.log('⏰ Token expiry:', new Date(expiredUser.resetPasswordExpire).toISOString());
      }
      
      return res.status(400).json({ 
        success: false,
        message: "Invalid or expired reset token" 
      });
    }

    console.log('✅ User found for token:', user.email);
    console.log('✅ Token expires at:', new Date(user.resetPasswordExpire).toISOString());

    // Update password and clear reset token
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    console.log('✅ Password reset successful for user:', user.email);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login with your new password."
    });

  } catch (error) {
    console.error('❌ Error in reset password:', error);
    return res.status(500).json({ 
      success: false,
      message: "Error resetting password",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    generateAccessAndRefreshTokens,
    cleanupLocalFile,
    forgotPassword,
    resetPassword
};
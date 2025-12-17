import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        // Required Fields
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        
        // Optional Fields
        username: {
            type: String,
            unique: true,
            sparse: true, // Allows null/multiple documents without username
            lowercase: true,
            trim: true,
            index: true
        },
        phoneNumber: {
            type: String,
            trim: true
        },
        profilePhoto: {
            type: String, // Cloudinary URL
            default: ""
        },
        
        // User Role (Required for your platform)
        role: {
            type: String,
            enum: ['admin', 'expert', 'provider', 'user'], // Your 4 user types
            default: 'user',
            required: true
        },
        
        // Specific Fields for Experts/Providers
        expertise: {
            type: [String], // Array of expertise areas for composting experts
            default: []
        },
        companyName: {
            type: String, // For waste management service providers
            trim: true
        },
        serviceArea: {
            type: [String], // Cities/PIN codes where service is provided
            default: []
        },
        experienceYears: {
            type: Number, // Years of experience (for experts)
            default: 0
        },
        certifications: {
            type: [String], // Professional certifications
            default: []
        },
        
        // Verification & Status
        isVerified: {
            type: Boolean,
            default: false // Admin needs to verify experts and providers
        },
        verificationStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        verificationDocuments: {
            type: [String], // URLs to verification documents
            default: []
        },
        
        // Contact Information
        address: {
            street: String,
            city: String,
            state: String,
            pincode: String,
            country: {
                type: String,
                default: "India"
            }
        },
        
        // Platform Activity
        servicesOffered: [{
            type: Schema.Types.ObjectId,
            ref: "Service"
        }],
        bookingsMade: [{
            type: Schema.Types.ObjectId,
            ref: "Booking"
        }],
        reviewsGiven: [{
            type: Schema.Types.ObjectId,
            ref: "Review"
        }],
        reviewsReceived: [{
            type: Schema.Types.ObjectId,
            ref: "Review"
        }],
        
        // Ratings
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalRatings: {
            type: Number,
            default: 0
        },
        
        // Social/Additional Info
        bio: {
            type: String,
            maxLength: 500
        },
        website: {
            type: String,
            trim: true
        },
        
        // Authentication
        refreshToken: {
            type: String
        },
        
        // Account Status
        isActive: {
            type: Boolean,
            default: true
        },
        lastLogin: {
            type: Date
        },
        resetPasswordToken: {
            type: String,
            default: null
        },
  
        resetPasswordExpire: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Create indexes for faster queries
userSchema.index({ role: 1, isVerified: 1 });
userSchema.index({ city: 1, state: 1 });
userSchema.index({ serviceArea: 1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Generate username if not provided
userSchema.pre("save", function(next) {
    if (!this.username && this.email) {
        // Create username from email (e.g., john.doe@gmail.com -> johndoe)
        const emailUsername = this.email.split('@')[0];
        this.username = emailUsername.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }
    next();
});

// Generate access token (JWT)
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            role: this.role,
            isVerified: this.isVerified
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d'
        }
    );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d'
        }
    );
};

// Method to check if user is admin
userSchema.methods.isAdmin = function() {
    return this.role === 'admin';
};

// Method to check if user is expert
userSchema.methods.isExpert = function() {
    return this.role === 'expert';
};

// Method to check if user is provider
userSchema.methods.isProvider = function() {
    return this.role === 'provider';
};

// Method to check if user is regular user
userSchema.methods.isRegularUser = function() {
    return this.role === 'user';
};

// Method to get user's display name
userSchema.methods.getDisplayName = function() {
    return this.fullName || this.username || this.email.split('@')[0];
};

// Method to check if user can create services
userSchema.methods.canCreateServices = function() {
    return this.isAdmin() || this.isExpert() || this.isProvider();
};

// Method to check if user is verified service provider
userSchema.methods.isVerifiedServiceProvider = function() {
    return (this.isExpert() || this.isProvider()) && this.isVerified;
};

// Virtual for formatted address
userSchema.virtual('formattedAddress').get(function() {
    if (!this.address) return '';
    const addr = this.address;
    const parts = [];
    if (addr.street) parts.push(addr.street);
    if (addr.city) parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.pincode) parts.push(addr.pincode);
    if (addr.country) parts.push(addr.country);
    return parts.join(', ');
});

// Static method to find by role
userSchema.statics.findByRole = function(role) {
    return this.find({ role: role });
};

// Static method to find verified experts/providers
userSchema.statics.findVerifiedProviders = function() {
    return this.find({ 
        role: { $in: ['expert', 'provider'] },
        isVerified: true,
        isActive: true
    });
};

export const User = mongoose.model("User", userSchema);
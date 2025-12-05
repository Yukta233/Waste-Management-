import mongoose, { Schema } from "mongoose";

const bookingSchema = new Schema(
    {
        // Booking Reference
        bookingId: {
            type: String,
            unique: true,
            required: true
        },
        
        // User who booked the service
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        
        // Service being booked
        service: {
            type: Schema.Types.ObjectId,
            ref: "Service",
            required: true
        },
        
        // Service Provider
        provider: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        
        // Booking Details
        bookingDate: {
            type: Date,
            required: true
        },
        timeSlot: {
            start: {
                type: String, // HH:MM format
                required: true
            },
            end: {
                type: String, // HH:MM format
                required: true
            }
        },
        
        // Service Location
        address: {
            type: String,
            required: true
        },
        location: {
            address: String,
            city: String,
            state: String,
            pincode: String,
            coordinates: {
                lat: Number,
                lng: Number
            }
        },
        
        // Contact Information
        contactPerson: {
            name: {
                type: String,
                required: true
            },
            phone: {
                type: String,
                required: true
            },
            email: {
                type: String
            }
        },
        
        // Special Instructions
        specialInstructions: {
            type: String,
            maxlength: 500
        },
        
        // Service Requirements (Based on service category)
        requirements: {
            // For waste collection
            wasteType: String,
            quantity: String, // e.g., "10kg", "2 bags"
            collectionPoint: String,
            
            // For home setup
            setupLocation: String, // e.g., "kitchen", "balcony", "garden"
            spaceAvailable: String,
            
            // For workshop
            numberOfParticipants: Number,
            
            // For compost product
            quantityOrdered: Number,
            deliveryInstructions: String
        },
        
        // Pricing and Payment
        basePrice: {
            type: Number,
            required: true
        },
        additionalCharges: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        totalAmount: {
            type: Number,
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded', 'partially_paid'],
            default: 'pending'
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'online', 'card', 'upi', 'wallet']
        },
        paymentId: {
            type: String
        },
        
        // Booking Status
        status: {
            type: String,
            enum: [
                'pending',      // Just created, not confirmed
                'confirmed',    // Provider accepted
                'scheduled',    // Date/time confirmed
                'in_progress',  // Service ongoing
                'completed',    // Service done
                'cancelled',    // Cancelled by user/provider
                'rejected',     // Provider rejected
                'expired'       // Not confirmed within timeframe
            ],
            default: 'pending'
        },
        
        // Cancellation Information
        cancelledBy: {
            type: String,
            enum: ['user', 'provider', 'system']
        },
        cancellationReason: {
            type: String
        },
        cancellationTime: {
            type: Date
        },
        
        // Completion Information
        completedAt: {
            type: Date
        },
        completionNotes: {
            type: String
        },
        
        // Rating and Review
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        review: {
            type: String,
            maxlength: 1000
        },
        reviewedAt: {
            type: Date
        },
        
        // Provider Notes
        providerNotes: {
            type: String
        },
        
        // Tracking
        scheduledReminderSent: {
            type: Boolean,
            default: false
        },
        dayBeforeReminderSent: {
            type: Boolean,
            default: false
        },
        
        // Admin Fields
        adminNotes: {
            type: String
        },
        lastUpdatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

// Indexes for faster queries
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ provider: 1, status: 1 });
bookingSchema.index({ service: 1, status: 1 });
bookingSchema.index({ bookingDate: 1, status: 1 });
bookingSchema.index({ "status": 1, "bookingDate": 1 });
bookingSchema.index({ bookingId: 1 });

// Pre-save middleware to generate booking ID
bookingSchema.pre('save', async function(next) {
    if (!this.bookingId) {
        const prefix = 'BOOK';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.bookingId = `${prefix}${timestamp}${random}`;
    }
    
    // Auto-populate provider from service if not set
    if (!this.provider && this.service) {
        try {
            const Service = mongoose.model('Service');
            const serviceDoc = await Service.findById(this.service).select('provider');
            if (serviceDoc) {
                this.provider = serviceDoc.provider;
            }
        } catch (error) {
            // Continue without provider
        }
    }
    
    next();
});

// Method to get formatted booking date
bookingSchema.methods.getFormattedDate = function() {
    const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    };
    return this.bookingDate.toLocaleDateString('en-IN', options);
};

// Method to get formatted time slot
bookingSchema.methods.getFormattedTime = function() {
    return `${this.timeSlot.start} - ${this.timeSlot.end}`;
};

// Method to get formatted amount
bookingSchema.methods.getFormattedAmount = function() {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(this.totalAmount);
};

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
    const now = new Date();
    const bookingDateTime = new Date(this.bookingDate);
    const hoursDifference = (bookingDateTime - now) / (1000 * 60 * 60);
    
    // Allow cancellation up to 2 hours before booking
    return ['pending', 'confirmed', 'scheduled'].includes(this.status) && hoursDifference > 2;
};

// Method to check if booking can be rated
bookingSchema.methods.canBeRated = function() {
    return this.status === 'completed' && !this.rating && !this.review;
};

// Method to update booking status
bookingSchema.methods.updateStatus = async function(newStatus, updatedBy = null) {
    const allowedTransitions = {
        'pending': ['confirmed', 'rejected', 'expired'],
        'confirmed': ['scheduled', 'cancelled'],
        'scheduled': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': [],
        'rejected': [],
        'expired': []
    };

    if (!allowedTransitions[this.status]?.includes(newStatus)) {
        throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
    }

    this.status = newStatus;
    
    // Set timestamps for certain statuses
    if (newStatus === 'completed') {
        this.completedAt = new Date();
    } else if (newStatus === 'cancelled') {
        this.cancellationTime = new Date();
    }
    
    if (updatedBy) {
        this.lastUpdatedBy = updatedBy;
    }
    
    await this.save();
    return this;
};

// Static method to find upcoming bookings
bookingSchema.statics.findUpcoming = function(userId) {
    return this.find({
        $or: [{ user: userId }, { provider: userId }],
        status: { $in: ['confirmed', 'scheduled'] },
        bookingDate: { $gte: new Date() }
    }).sort({ bookingDate: 1 });
};

// Static method to find past bookings
bookingSchema.statics.findPast = function(userId) {
    return this.find({
        $or: [{ user: userId }, { provider: userId }],
        status: { $in: ['completed', 'cancelled'] }
    }).sort({ bookingDate: -1 });
};

// Static method to calculate booking statistics
bookingSchema.statics.getStats = async function(userId, role) {
    const matchStage = role === 'provider' 
        ? { provider: userId }
        : { user: userId };

    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalBookings: { $sum: 1 },
                completed: { 
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                },
                cancelled: { 
                    $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
                },
                pending: { 
                    $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                },
                totalRevenue: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$totalAmount", 0] }
                }
            }
        }
    ]);

    return stats[0] || {
        totalBookings: 0,
        completed: 0,
        cancelled: 0,
        pending: 0,
        totalRevenue: 0
    };
};

export const Booking = mongoose.model("Booking", bookingSchema);
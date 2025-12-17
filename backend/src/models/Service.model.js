import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema(
    {
        // Basic Information
        title: {
            type: String,
            required: [true, "Service title is required"],
            trim: true,
            maxlength: [100, "Title cannot exceed 100 characters"]
        },
        description: {
            type: String,
            required: [true, "Service description is required"],
            trim: true,
            maxlength: [1000, "Description cannot exceed 1000 characters"]
        },
        
        // Service Provider
        provider: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        
        // Service Category (Based on your requirements)
        category: {
            type: String,
            required: true,
            enum: [
                'home-setup',        // Home compost setup
                'kitchen-compost',   // Kitchen waste composting
                'garden-compost',    // Garden composting
                'community-compost', // Society/community composting
                'compost-product',   // Buy organic compost
                'workshop-training', // Workshops / training
                'waste-collection',  // Legacy/other collection types
                'consultation',      // Expert consultation
                'maintenance',       // Compost maintenance
                'equipment-rental',  // Equipment rental
                'others'             // Other services
            ]
        },
        
        // Pricing
        price: {
            type: Number,
            required: true,
            min: [0, "Price cannot be negative"]
        },
        priceType: {
            type: String,
            enum: ['fixed', 'hourly', 'daily', 'weekly', 'monthly', 'per-kg', 'subscription'],
            default: 'fixed'
        },
        currency: {
            type: String,
            default: 'INR'
        },
        
        // Location Information
        location: {
            address: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            state: {
                type: String,
                required: true
            },
            pincode: {
                type: String,
                required: true
            },
            coordinates: {
                lat: { type: Number },
                lng: { type: Number }
            }
        },
        
        // Service Details
        serviceArea: [{
            type: String // Array of cities/pincodes where service is available
        }],
        availability: {
            type: String,
            enum: ['weekdays', 'mon-fri', 'weekends', 'anytime', 'specific', 'custom'],
            default: 'anytime'
        },
        availabilityDetails: {
            // For specific availability
            days: [{
                day: {
                    type: String,
                    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                },
                slots: [{
                    start: String, // HH:MM format
                    end: String    // HH:MM format
                }]
            }]
        },
        
        // Service Features
        features: [{
            type: String // e.g., "Organic materials", "Home delivery", "Installation included"
        }],
        
        // Images
        images: [{
            type: String // Cloudinary URLs
        }],
        
        // Service Specifications (Based on category)
        specifications: {
            // For home setup
            setupType: {
                type: String,
                enum: ['kitchen', 'balcony', 'garden', 'vermicompost', 'community']
            },
            capacity: String, // e.g., "10kg", "50 liters"
            materialsIncluded: [String],
            duration: String, // e.g., "2 hours", "1 day"
            
            // For waste collection
            collectionFrequency: {
                type: String,
                enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'on-demand']
            },
            wasteType: [{
                type: String,
                enum: ['kitchen', 'garden', 'agricultural', 'industrial', 'mixed']
            }],
            minQuantity: String, // e.g., "5kg"
            
            // For compost product
            productType: {
                type: String,
                enum: ['vermicompost', 'organic-manure', 'potting-mix', 'leaf-compost']
            },
            weight: String, // e.g., "2kg", "5kg", "10kg"
            packaging: String,
            
            // For workshop
            durationHours: Number,
            participantsLimit: Number,
            materialsProvided: Boolean,
            certificationProvided: Boolean
        },
        
        // Ratings and Reviews
        ratings: {
            average: {
                type: Number,
                default: 0,
                min: 0,
                max: 5
            },
            count: {
                type: Number,
                default: 0
            }
        },
        
        // Booking Information
        bookingsCount: {
            type: Number,
            default: 0
        },
        bookedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        bookedAt: {
            type: Date
        },
        isAvailable: {
            type: Boolean,
            default: true
        },
        
        // Service Status
        status: {
            type: String,
            enum: ['active', 'inactive', 'pending', 'rejected'],
            default: 'pending' // Admin needs to approve services
        },
        
        // Admin Approval
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        approvedAt: {
            type: Date
        },
        rejectionReason: {
            type: String
        },
        
        // SEO and Search
        tags: [{
            type: String,
            lowercase: true
        }],
        
        // Timestamps
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Indexes for faster queries
serviceSchema.index({ provider: 1, status: 1 });
serviceSchema.index({ category: 1, status: 1 });
serviceSchema.index({ "location.city": 1, status: 1 });
serviceSchema.index({ "location.pincode": 1, status: 1 });
serviceSchema.index({ price: 1, status: 1 });
serviceSchema.index({ "ratings.average": -1, status: 1 });
serviceSchema.index({ tags: 1 });
serviceSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Pre-save middleware to update updatedAt
serviceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Auto-generate tags from title and description
    if (this.isModified('title') || this.isModified('description')) {
        const titleTags = this.title.toLowerCase().split(' ').filter(word => word.length > 3);
        const descTags = this.description.toLowerCase().split(' ').filter(word => word.length > 3);
        this.tags = [...new Set([...titleTags, ...descTags, this.category])];
    }
    
    next();
});

// Method to check if service is active
serviceSchema.methods.isActive = function() {
    return this.status === 'active' && this.isAvailable;
};

// Method to get formatted price
serviceSchema.methods.getFormattedPrice = function() {
    const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: this.currency || 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    let priceText = formatter.format(this.price);
    
    if (this.priceType !== 'fixed') {
        priceText += ` per ${this.priceType}`;
    }
    
    return priceText;
};

// Method to get location string
serviceSchema.methods.getLocationString = function() {
    return `${this.location.city}, ${this.location.state} - ${this.location.pincode}`;
};

// Static method to find active services
serviceSchema.statics.findActiveServices = function() {
    return this.find({ 
        status: 'active',
        isAvailable: true
    });
};

// Static method to find services by city
serviceSchema.statics.findByCity = function(city) {
    return this.find({
        "location.city": new RegExp(city, 'i'),
        status: 'active',
        isAvailable: true
    });
};

// Static method to find services near location
serviceSchema.statics.findNearLocation = function(lat, lng, maxDistance = 5000) {
    return this.find({
        "location.coordinates": {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat]
                },
                $maxDistance: maxDistance // in meters
            }
        },
        status: 'active',
        isAvailable: true
    });
};

export const Service = mongoose.model("Service", serviceSchema);
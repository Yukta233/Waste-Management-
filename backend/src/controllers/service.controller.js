import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Service } from "../models/Service.model.js";
import { User } from "../models/User.model.js";
import { uploadOnCloudinary as uploadImage } from "../config/cloudinary.js";

// Category normalization helpers to align frontend and backend values
const FrontToModelCategory = {
  home_setup: 'home-setup',
  kitchen_compost: 'kitchen-compost',
  garden_compost: 'garden-compost',
  community_compost: 'community-compost',
  workshop: 'workshop-training',
  sell_compost: 'compost-product',
};
const mapCategory = (input) => {
  if (!input) return input;
  const key = String(input).toLowerCase();
  return FrontToModelCategory[key] || key;
};

const createService = asyncHandler(async (req, res) => {
    // Check if user is authorized to create services
    const user = await User.findById(req.user._id);
    
    if (!user.canCreateServices()) {
        throw new ApiError(403, "You are not authorized to create services");
    }

    const {
        title,
        description,
        category,
        price,
        priceType = 'fixed',
        currency = 'INR',
        address,
        city,
        state,
        pincode,
        serviceArea,
        availability = 'anytime',
        features,
        specifications,
        tags,
        images: bodyImages
    } = req.body;
    const normalizedCategory = mapCategory(category);

    // Validate required fields
    if (!title || !description || !normalizedCategory || price === undefined || price === null || isNaN(Number(price)) || !city || !state || !pincode) {
        throw new ApiError(400, "Please provide all required fields");
    }

    // Validate category
    const validCategories = [
        'home-setup',
        'waste-collection', 
        'compost-product',
        'workshop-training',
        'consultation',
        'maintenance',
        'equipment-rental',
        'others',
        // Extended to support mapped frontend categories
        'kitchen-compost',
        'garden-compost',
        'community-compost'
    ];
    
    if (!validCategories.includes(normalizedCategory)) {
        throw new ApiError(400, "Invalid service category");
    }

    // Handle image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
        for (let file of req.files) {
            try {
                const uploadResult = await uploadImage(file.path);
                images.push(uploadResult.url);
            } catch (error) {
                throw new ApiError(400, "Error uploading images");
            }
        }
    } else if (Array.isArray(bodyImages) && bodyImages.length > 0) {
        images = bodyImages;
    }

    // Parse specifications
    let parsedSpecifications = {};
    if (specifications) {
        try {
            parsedSpecifications = typeof specifications === 'string' 
                ? JSON.parse(specifications) 
                : specifications;
        } catch (error) {
            throw new ApiError(400, "Invalid specifications format");
        }
    }

    // Parse features
    let parsedFeatures = [];
    if (features) {
        parsedFeatures = typeof features === 'string'
            ? features.split(',').map(f => f.trim())
            : features;
    }

    // Parse service area
    let parsedServiceArea = [];
    if (serviceArea) {
        parsedServiceArea = typeof serviceArea === 'string'
            ? serviceArea.split(',').map(area => area.trim())
            : serviceArea;
    }

    // Parse tags
    let parsedTags = [];
    if (tags) {
        parsedTags = typeof tags === 'string'
            ? tags.split(',').map(tag => tag.trim().toLowerCase())
            : tags;
    }

    // Create service
    const initialStatus = (process.env.NODE_ENV !== 'production' || user.isAdmin()) ? 'active' : 'pending';
    const service = await Service.create({
        title,
        description,
        provider: req.user._id,
        category: normalizedCategory,
        price: parseFloat(price),
        priceType,
        currency,
        location: {
            address: address || "",
            city,
            state,
            pincode
        },
        serviceArea: parsedServiceArea,
        availability,
        features: parsedFeatures,
        images,
        specifications: parsedSpecifications,
        tags: parsedTags,
        status: initialStatus,
        isAvailable: initialStatus === 'active'
    });

    // Add service to user's servicesOffered
    await User.findByIdAndUpdate(
        req.user._id,
        { $push: { servicesOffered: service._id } }
    );

    return res
        .status(201)
        .json(
            new ApiResponse(
                201, 
                service, 
                user.isAdmin() 
                    ? "Service created successfully and is now active" 
                    : "Service created successfully. Waiting for admin approval."
            )
        );
});

const getAllServices = asyncHandler(async (req, res) => {
    const {
        category,
        city,
        minPrice,
        maxPrice,
        provider,
        status = 'active',
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Non-admin users can only see active services
    if (!req.user?.isAdmin()) {
        filter.status = 'active';
        filter.isAvailable = true;
    } else if (status) {
        filter.status = status;
    }
    
    if (category) filter.category = mapCategory(category);
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (provider) filter.provider = provider;
    
    // Price filter
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const services = await Service.find(filter)
        .populate('provider', 'fullName profilePhoto averageRating companyName')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

    // Get total count for pagination
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

const getServiceById = asyncHandler(async (req, res) => {
    const { serviceId } = req.params;

    // Populate provider details. 'reviews' is not part of Service schema
    // so avoid populating it here to prevent strict populate errors.
    const service = await Service.findById(serviceId)
        .populate('provider', 'fullName profilePhoto bio expertise averageRating totalRatings');

    if (!service) {
        throw new ApiError(404, "Service not found");
    }

    // Only show active services to non-admin users
    if (!req.user?.isAdmin() && service.status !== 'active') {
        throw new ApiError(404, "Service not found");
    }

    // Increment view count (you can add this field to Service model)
    service.views = (service.views || 0) + 1;
    await service.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, service, "Service fetched successfully")
        );
});

const updateService = asyncHandler(async (req, res) => {
    const { serviceId } = req.params;
    
    const service = await Service.findById(serviceId);
    
    if (!service) {
        throw new ApiError(404, "Service not found");
    }

    // Check if user is owner or admin
    if (!service.provider.equals(req.user._id) && !req.user.isAdmin()) {
        throw new ApiError(403, "You are not authorized to update this service");
    }

    // Update fields from request body
    const updateData = { ...req.body };
    
    // Handle image updates
    if (req.files && req.files.length > 0) {
        const newImages = [];
        for (let file of req.files) {
            const uploadResult = await uploadImage(file.path);
            newImages.push(uploadResult.url);
        }
        updateData.images = [...service.images, ...newImages];
    }

    // Convert price/category if present
    if (updateData.price !== undefined) {
        updateData.price = parseFloat(updateData.price);
    }
    if (updateData.category) {
        updateData.category = mapCategory(updateData.category);
    }

    // Update service
    const updatedService = await Service.findByIdAndUpdate(
        serviceId,
        updateData,
        { new: true, runValidators: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedService, "Service updated successfully")
        );
});

const deleteService = asyncHandler(async (req, res) => {
    const { serviceId } = req.params;
    
    const service = await Service.findById(serviceId);
    
    if (!service) {
        throw new ApiError(404, "Service not found");
    }

    // Check if user is owner or admin
    if (!service.provider.equals(req.user._id) && !req.user.isAdmin()) {
        throw new ApiError(403, "You are not authorized to delete this service");
    }

    // Soft delete - change status to inactive
    service.status = 'inactive';
    service.isAvailable = false;
    await service.save();

    // Remove from user's servicesOffered
    await User.findByIdAndUpdate(
        service.provider,
        { $pull: { servicesOffered: service._id } }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Service deleted successfully")
        );
});

const getServicesByProvider = asyncHandler(async (req, res) => {
    const { providerId } = req.params;
    const { status } = req.query;

    const filter = { provider: providerId };

    const isAdmin = !!req.user && typeof req.user.isAdmin === 'function' ? req.user.isAdmin() : false;
    const isSelf = !!req.user && req.user._id && req.user._id.toString() === providerId;
    
    // For public or other users: only show active & available
    if (!isAdmin && !isSelf) {
        filter.status = 'active';
        filter.isAvailable = true;
    } else if (status) {
        filter.status = status;
    }

    const services = await Service.find(filter)
        .populate('provider', 'fullName profilePhoto')
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(200, services, "Provider services fetched successfully")
        );
});

const updateServiceStatus = asyncHandler(async (req, res) => {
    // Only admin can update service status
    if (!req.user.isAdmin()) {
        throw new ApiError(403, "Admin access required");
    }

    const { serviceId } = req.params;
    const { status, rejectionReason } = req.body;

    const validStatuses = ['active', 'rejected', 'inactive'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const service = await Service.findById(serviceId);
    if (!service) {
        throw new ApiError(404, "Service not found");
    }

    service.status = status;
    service.isAvailable = status === 'active';
    
    if (status === 'active') {
        service.approvedBy = req.user._id;
        service.approvedAt = new Date();
        service.rejectionReason = undefined;
    } else if (status === 'rejected' && rejectionReason) {
        service.rejectionReason = rejectionReason;
    }

    await service.save();

    // Notify provider about status change (you can implement email notification here)

    return res
        .status(200)
        .json(
            new ApiResponse(200, service, `Service ${status} successfully`)
        );
});

export {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService,
    getServicesByProvider,
    updateServiceStatus
};
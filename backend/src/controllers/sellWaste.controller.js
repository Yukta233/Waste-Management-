import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { SellWaste } from '../models/SellWaste.model.js';
import { User } from '../models/User.model.js';
import { notificationUtils } from '../controllers/notification.controller.js';

/**
 * Create a sell-waste listing (USER)
 */
export const createListing = asyncHandler(async (req, res) => {
  const user = req.user;
  const { wasteType, quantityKg, preferredPickupAt } = req.body;

  if (!wasteType || !['plastic', 'paper', 'metal', 'e-waste', 'glass'].includes(wasteType)) {
    throw new ApiError(400, 'Invalid or unsupported waste type');
  }

  if (!quantityKg || isNaN(Number(quantityKg)) || Number(quantityKg) <= 0) {
    throw new ApiError(400, 'Quantity must be a positive number');
  }

  let address = user?.address || {};
  if (typeof req.body.address === 'string') {
    try {
      address = JSON.parse(req.body.address);
    } catch {
      address = { address: req.body.address };
    }
  } else if (req.body.address) {
    address = req.body.address;
  }

  const images = [];
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      images.push(file.path || file.filename || file.location || '');
    }
  }

  const listing = await SellWaste.create({
    user: user._id,
    wasteType,
    quantityKg: Number(quantityKg),
    address,
    preferredPickupAt: preferredPickupAt ? new Date(preferredPickupAt) : undefined,
    images,
    status: 'open'
  });

  res.status(201).json({ success: true, data: listing });
});

/**
 * Get open listings (PROVIDERS)
 */
export const listOpen = asyncHandler(async (req, res) => {
  const { city, pincode, wasteType, minQuantity, maxQuantity } = req.query;

  console.log('listOpen called with query:', req.query);
  
  // Build query for open listings
  const query = { 
    status: 'open',
    // Exclude listings where this provider has already made an offer
    'offers.provider': { $ne: req.user._id }
  };
  
  // Add filters if provided
  if (city) {
    // Handle both string address and object address
    query.$or = [
      { 'address.city': { $regex: city, $options: 'i' } },
      { 'address': { $regex: city, $options: 'i' } }
    ];
  }
  
  if (pincode) {
    query.$or = [
      { 'address.pincode': pincode },
      { 'address': { $regex: pincode, $options: 'i' } }
    ];
  }
  
  if (wasteType) {
    query.wasteType = wasteType;
  }
  
  // Quantity filters
  if (minQuantity || maxQuantity) {
    query.quantityKg = {};
    if (minQuantity) query.quantityKg.$gte = parseFloat(minQuantity);
    if (maxQuantity) query.quantityKg.$lte = parseFloat(maxQuantity);
  }

  console.log('Query for open listings:', JSON.stringify(query, null, 2));

  try {
    const listings = await SellWaste.find(query)
      .populate('user', 'fullName email profilePhoto phoneNumber')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`Found ${listings.length} open listings`);

    // Format the response
    const formattedListings = listings.map(listing => {
      const listingObj = listing.toObject();
      
      // Format address for display
      if (listingObj.address) {
        if (typeof listingObj.address === 'string') {
          listingObj.addressDisplay = listingObj.address;
        } else if (listingObj.address.address) {
          listingObj.addressDisplay = listingObj.address.address;
          if (listingObj.address.city) {
            listingObj.addressDisplay += `, ${listingObj.address.city}`;
          }
        } else {
          listingObj.addressDisplay = JSON.stringify(listingObj.address);
        }
      }
      
      // Check if provider has already made an offer
      const hasProviderOffer = listing.offers?.some(offer => 
        offer.provider && offer.provider.toString() === req.user._id.toString()
      );
      listingObj.hasProviderOffer = hasProviderOffer;
      
      return listingObj;
    });

    res.json({ 
      success: true, 
      data: formattedListings,
      count: formattedListings.length,
      filters: { city, pincode, wasteType }
    });
  } catch (error) {
    console.error('Error fetching open listings:', error);
    throw new ApiError(500, 'Failed to fetch open listings: ' + error.message);
  }
});

/**
 * Get my listings (USER)
 */
export const myListings = asyncHandler(async (req, res) => {
  const listings = await SellWaste.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.json({ success: true, data: listings });
});

/**
 * Provider: Get listings assigned to me (accepted/scheduled/completed)
 */
export const providerAssigned = asyncHandler(async (req, res) => {
  const providerId = req.user._id;
  
  // Get statuses from query or default to assigned statuses
  const statuses = req.query.statuses 
    ? String(req.query.statuses).split(',') 
    : ['accepted', 'scheduled', 'completed', 'cancelled'];

  // Find listings where this provider is assigned
  const listings = await SellWaste.find({ 
    provider: providerId, 
    status: { $in: statuses } 
  })
    .populate('user', 'fullName email phoneNumber address')
    .populate('acceptedOffer')
    .sort({ updatedAt: -1 });

  res.json({ 
    success: true, 
    data: listings,
    count: listings.length,
    statuses: statuses
  });
});

/**
 * Provider offers a price (PROVIDER / EXPERT / ADMIN)
 */
export const providerOffer = asyncHandler(async (req, res) => {
  const provider = req.user;
  const { pricePerKg, message } = req.body;

  const listing = await SellWaste.findById(req.params.id)
    .populate('user', 'fullName');

  if (!listing) throw new ApiError(404, 'Listing not found');

  if (!provider.isProvider && !provider.isExpert && !provider.isAdmin) {
    throw new ApiError(403, 'Not authorized');
  }

  if (!pricePerKg || isNaN(Number(pricePerKg))) {
    throw new ApiError(400, 'Invalid price');
  }

  const totalPrice = Number(pricePerKg) * Number(listing.quantityKg || 0);

  listing.offers.push({
    provider: provider._id,
    pricePerKg: Number(pricePerKg),
    totalPrice,
    message,
    status: 'pending' // Initialize offer status as pending
  });

  listing.status = 'offered';
  await listing.save();

  // 🔔 Notify user
  await notificationUtils.createSellWasteOfferNotification(
    listing.user._id,
    listing._id,
    provider.fullName,
    totalPrice
  );

  res.json({ success: true, data: listing });
});

/**
 * User accepts an offer (USER)
 */
export const acceptOffer = asyncHandler(async (req, res) => {
  const user = req.user;
  const { offerId } = req.body;
  const listing = await SellWaste.findById(req.params.id);
  
  if (!listing) throw new ApiError(404, 'Listing not found');
  if (String(listing.user) !== String(user._id)) throw new ApiError(403, 'Not allowed');

  const offer = listing.offers.id(offerId);
  if (!offer) throw new ApiError(404, 'Offer not found');
  
  // Mark this offer as accepted and others as rejected
  listing.offers.forEach(o => {
    if (o._id.equals(offerId)) {
      o.status = 'accepted';
      o.acceptedAt = new Date();
    } else {
      o.status = 'rejected';
    }
  });
  
  listing.acceptedOffer = offer._id;
  listing.provider = offer.provider;
  listing.finalizedPrice = offer.totalPrice;
  listing.status = 'accepted';
  listing.acceptedAt = new Date();
  
  await listing.save();

  // 🔔 Create notification for the provider
  await notificationUtils.createSellWasteStatusNotification(
    offer.provider,
    listing._id,
    listing.wasteType,
    'accepted'
  );

  // 🔔 Notify other providers whose offers were rejected
  for (const o of listing.offers) {
    if (!o._id.equals(offerId) && o.provider) {
      await notificationUtils.createSellWasteStatusNotification(
        o.provider,
        listing._id,
        listing.wasteType,
        'rejected'
      );
    }
  }

  res.json({ success: true, data: listing });
});

/**
 * Provider updates status (scheduled/completed/cancelled)
 */
export const updateStatus = asyncHandler(async (req, res) => {
  const provider = req.user;
  const { status } = req.body; // 'scheduled' or 'completed' or 'cancelled'
  
  const listing = await SellWaste.findById(req.params.id).populate('user');
  if (!listing) throw new ApiError(404, 'Listing not found');

  // Only the assigned provider can change status
  if (!listing.provider || String(listing.provider) !== String(provider._id)) {
    throw new ApiError(403, 'Not authorized to update this listing');
  }

  // Validate allowed status transitions
  const allowedTransitions = {
    'accepted': ['scheduled', 'cancelled'],
    'scheduled': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': []
  };

  if (!allowedTransitions[listing.status]?.includes(status)) {
    throw new ApiError(400, `Cannot change status from ${listing.status} to ${status}`);
  }

  const oldStatus = listing.status;
  listing.status = status;
  
  // Add timestamp for completed status
  if (status === 'completed') {
    listing.completedAt = new Date();
  }
  
  // Add timestamp for cancelled status
  if (status === 'cancelled') {
    listing.cancelledAt = new Date();
    listing.cancelledBy = 'provider';
  }
  
  await listing.save();

  // 🔔 Create notification for the user
  if (status !== oldStatus && listing.user) {
    await notificationUtils.createSellWasteStatusNotification(
      listing.user._id,
      listing._id,
      listing.wasteType,
      status
    );
  }

  res.json({ success: true, data: listing });
});

/**
 * Get listing by ID (for both user and provider)
 */
export const getListingById = asyncHandler(async (req, res) => {
  const listing = await SellWaste.findById(req.params.id)
    .populate('user', 'fullName email phoneNumber address profilePhoto')
    .populate('provider', 'fullName email phoneNumber companyName')
    .populate('offers.provider', 'fullName email companyName rating');

  if (!listing) throw new ApiError(404, 'Listing not found');

  // Check authorization
  const isOwner = listing.user && listing.user._id.equals(req.user._id);
  const isProvider = listing.provider && listing.provider._id.equals(req.user._id);
  const isAdmin = req.user.isAdmin;

  if (!isOwner && !isProvider && !isAdmin) {
    throw new ApiError(403, 'Not authorized to view this listing');
  }

  res.json({ success: true, data: listing });
});

/**
 * User cancels their own listing
 */
export const cancelListing = asyncHandler(async (req, res) => {
  const user = req.user;
  const listing = await SellWaste.findById(req.params.id);

  if (!listing) throw new ApiError(404, 'Listing not found');
  if (!listing.user.equals(user._id)) throw new ApiError(403, 'Not authorized');

  // Only allow cancellation if status is open or offered
  if (!['open', 'offered'].includes(listing.status)) {
    throw new ApiError(400, 'Cannot cancel listing in current status');
  }

  listing.status = 'cancelled';
  listing.cancelledAt = new Date();
  listing.cancelledBy = 'user';
  
  await listing.save();

  // 🔔 Notify providers if there were offers
  if (listing.offers && listing.offers.length > 0) {
    for (const offer of listing.offers) {
      if (offer.provider) {
        await notificationUtils.createSellWasteStatusNotification(
          offer.provider,
          listing._id,
          listing.wasteType,
          'cancelled'
        );
      }
    }
  }

  res.json({ success: true, data: listing });
});

/**
 * Get provider's offered listings (where provider has made an offer)
 */
export const providerOffered = asyncHandler(async (req, res) => {
  const providerId = req.user._id;

  const listings = await SellWaste.find({
    'offers.provider': providerId,
    status: { $in: ['offered', 'accepted', 'scheduled', 'completed'] }
  })
    .populate('user', 'fullName email phoneNumber')
    .sort({ updatedAt: -1 });

  res.json({ 
    success: true, 
    data: listings,
    count: listings.length
  });
});

/**
 * Get offers for a specific listing
 */
export const getOffersForListing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const listing = await SellWaste.findById(id)
    .populate('offers.provider', 'fullName email companyName rating profilePhoto');
  
  if (!listing) {
    throw new ApiError(404, 'Listing not found');
  }
  
  // Check if user is owner or admin
  if (!listing.user.equals(req.user._id) && !req.user.isAdmin) {
    throw new ApiError(403, 'Not authorized to view offers');
  }
  
  res.json({
    success: true,
    data: {
      offers: listing.offers || [],
      count: listing.offers?.length || 0,
      listingId: listing._id
    }
  });
});

/**
 * User rejects an offer
 */
export const rejectOffer = asyncHandler(async (req, res) => {
  const user = req.user;
  const { offerId } = req.body;
  const listing = await SellWaste.findById(req.params.id);
  
  if (!listing) throw new ApiError(404, 'Listing not found');
  if (String(listing.user) !== String(user._id)) {
    throw new ApiError(403, 'Not authorized to reject offers for this listing');
  }
  
  const offer = listing.offers.id(offerId);
  if (!offer) throw new ApiError(404, 'Offer not found');
  
  // Mark offer as rejected
  offer.status = 'rejected';
  await listing.save();
  
  // 🔔 Notify provider about rejection
  await notificationUtils.createSellWasteStatusNotification(
    offer.provider,
    listing._id,
    listing.wasteType,
    'rejected'
  );
  
  res.json({ 
    success: true, 
    message: 'Offer rejected successfully',
    data: listing 
  });
});

/**
 * Provider withdraws an offer
 */
export const withdrawOffer = asyncHandler(async (req, res) => {
  const provider = req.user;
  const { offerId } = req.body;
  const listing = await SellWaste.findById(req.params.id);
  
  if (!listing) throw new ApiError(404, 'Listing not found');
  
  const offer = listing.offers.id(offerId);
  if (!offer) throw new ApiError(404, 'Offer not found');
  
  // Check if this provider made the offer
  if (!offer.provider.equals(provider._id)) {
    throw new ApiError(403, 'Not authorized to withdraw this offer');
  }
  
  // Remove the offer
  listing.offers.pull({ _id: offerId });
  
  // If this was the only offer and listing status was 'offered', revert to 'open'
  if (listing.status === 'offered' && listing.offers.length === 0) {
    listing.status = 'open';
  }
  
  await listing.save();
  
  // 🔔 Notify user about withdrawn offer
  await notificationUtils.createSellWasteStatusNotification(
    listing.user,
    listing._id,
    listing.wasteType,
    'offer_withdrawn'
  );
  
  res.json({ 
    success: true, 
    message: 'Offer withdrawn successfully',
    data: listing 
  });
});

/**
 * User rates completed pickup
 */
export const ratePickup = asyncHandler(async (req, res) => {
  const user = req.user;
  const { rating, review } = req.body;
  const listing = await SellWaste.findById(req.params.id);
  
  if (!listing) throw new ApiError(404, 'Listing not found');
  if (!listing.user.equals(user._id)) {
    throw new ApiError(403, 'Not authorized to rate this pickup');
  }
  
  if (listing.status !== 'completed') {
    throw new ApiError(400, 'Can only rate completed pickups');
  }
  
  if (rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5');
  }
  
  listing.userRating = rating;
  listing.userReview = review;
  listing.ratedAt = new Date();
  
  await listing.save();
  
  // 🔔 Notify provider about rating
  if (listing.provider) {
    await notificationUtils.createSellWasteStatusNotification(
      listing.provider,
      listing._id,
      listing.wasteType,
      'rated'
    );
  }
  
  res.json({ 
    success: true, 
    message: 'Thank you for your rating!',
    data: listing 
  });
});

/**
 * Get statistics for provider dashboard
 */
export const getProviderStats = asyncHandler(async (req, res) => {
  const providerId = req.user._id;
  
  const [totalOffers, acceptedOffers, completedPickups, pendingOffers] = await Promise.all([
    // Total offers made
    SellWaste.countDocuments({ 'offers.provider': providerId }),
    
    // Accepted offers
    SellWaste.countDocuments({ 
      provider: providerId,
      status: { $in: ['accepted', 'scheduled', 'completed'] }
    }),
    
    // Completed pickups
    SellWaste.countDocuments({ 
      provider: providerId,
      status: 'completed'
    }),
    
    // Pending offers (not accepted/rejected)
    SellWaste.countDocuments({ 
      'offers.provider': providerId,
      'offers.status': 'pending',
      status: 'offered'
    })
  ]);
  
  // Calculate earnings from completed pickups
  const earningsResult = await SellWaste.aggregate([
    { 
      $match: { 
        provider: providerId,
        status: 'completed',
        finalizedPrice: { $exists: true, $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$finalizedPrice' }
      }
    }
  ]);
  
  const totalEarnings = earningsResult[0]?.totalEarnings || 0;
  
  // Calculate average rating
  const ratingResult = await SellWaste.aggregate([
    { 
      $match: { 
        provider: providerId,
        status: 'completed',
        userRating: { $exists: true, $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$userRating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);
  
  const averageRating = ratingResult[0]?.averageRating || 0;
  const totalRatings = ratingResult[0]?.totalRatings || 0;
  
  res.json({
    success: true,
    data: {
      totalOffers,
      acceptedOffers,
      completedPickups,
      pendingOffers,
      totalEarnings,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings
    }
  });
});
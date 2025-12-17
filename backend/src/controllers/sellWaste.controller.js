import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { SellWaste } from '../models/SellWaste.model.js';
import { User } from '../models/User.model.js';

// Create a sell-waste listing (user)
export const createListing = asyncHandler(async (req, res) => {
  const user = req.user;
  const { wasteType, quantityKg, preferredPickupAt } = req.body;
  if (!wasteType || !['plastic','paper','metal','e-waste','glass'].includes(wasteType)) {
    throw new ApiError(400, 'Invalid or unsupported waste type');
  }
  if (!quantityKg || isNaN(Number(quantityKg)) || Number(quantityKg) <= 0) {
    throw new ApiError(400, 'Quantity must be a positive number');
  }

  let address = user?.address || {};
  if (typeof req.body.address === 'string') {
    try { address = JSON.parse(req.body.address || '{}'); } catch { address = { address: req.body.address }; }
  } else if (req.body.address) {
    address = req.body.address;
  }

  const images = [];
  // Multer .array('images') sets req.files to an array
  if (req.files && Array.isArray(req.files)) {
    for (const f of req.files) images.push(f.path || f.filename || f.location || '');
  }

  const listing = await SellWaste.create({
    user: user._id,
    wasteType,
    quantityKg: Number(quantityKg),
    address,
    preferredPickupAt: preferredPickupAt ? new Date(preferredPickupAt) : undefined,
    images
  });

  res.status(201).json({ success: true, data: listing });
});

// Get open listings (for providers)
export const listOpen = asyncHandler(async (req, res) => {
  const { city, pincode } = req.query;
  const query = { status: 'open' };
  if (city) query['address.city'] = city;
  if (pincode) query['address.pincode'] = pincode;

  const listings = await SellWaste.find(query).populate('user', 'fullName email profilePhoto address').sort({ createdAt: -1 });
  res.json({ success: true, data: listings });
});

// Get my listings (user)
export const myListings = asyncHandler(async (req, res) => {
  const listings = await SellWaste.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: listings });
});

// Provider offers a price
export const providerOffer = asyncHandler(async (req, res) => {
  const provider = req.user;
  const { pricePerKg, message } = req.body;
  const listing = await SellWaste.findById(req.params.id);
  if (!listing) throw new ApiError(404, 'Listing not found');
  if (!provider.isProvider && !provider.isExpert && !provider.isAdmin) {
    // extra guard; main protection via middleware
    throw new ApiError(403, 'Not authorized');
  }
  if (!pricePerKg || isNaN(Number(pricePerKg))) throw new ApiError(400, 'Invalid price');

  const totalPrice = Number(pricePerKg) * Number(listing.quantityKg || 0);
  listing.offers.push({ provider: provider._id, pricePerKg: Number(pricePerKg), totalPrice, message });
  listing.status = 'offered';
  await listing.save();

  res.json({ success: true, data: listing });
});

// User accepts an offer
export const acceptOffer = asyncHandler(async (req, res) => {
  const user = req.user;
  const { offerId } = req.body;
  const listing = await SellWaste.findById(req.params.id);
  if (!listing) throw new ApiError(404, 'Listing not found');
  if (String(listing.user) !== String(user._id)) throw new ApiError(403, 'Not allowed');

  const offer = listing.offers.id(offerId);
  if (!offer) throw new ApiError(404, 'Offer not found');
  offer.accepted = true;
  listing.acceptedOffer = offer._id;
  listing.provider = offer.provider;
  listing.finalizedPrice = offer.totalPrice;
  listing.status = 'accepted';
  await listing.save();

  res.json({ success: true, data: listing });
});

// Provider: list assigned sell-waste (accepted/scheduled/completed)
export const providerAssigned = asyncHandler(async (req, res) => {
  const providerId = req.user._id;
  const statuses = (req.query.statuses ? String(req.query.statuses).split(',') : ['accepted','scheduled','completed']);
  const listings = await SellWaste.find({ provider: providerId, status: { $in: statuses } })
    .populate('user', 'fullName email phoneNumber')
    .sort({ updatedAt: -1 });
  res.json({ success: true, data: listings });
});

// Provider marks scheduled or completed
export const updateStatus = asyncHandler(async (req, res) => {
  const provider = req.user;
  const { status } = req.body; // 'scheduled' or 'completed' or 'cancelled'
  const listing = await SellWaste.findById(req.params.id);
  if (!listing) throw new ApiError(404, 'Listing not found');

  // Only the assigned provider can change status
  if (!listing.provider || String(listing.provider) !== String(provider._id)) {
    throw new ApiError(403, 'Not authorized to update this listing');
  }

  if (!['scheduled','completed','cancelled'].includes(status)) throw new ApiError(400, 'Invalid status');

  listing.status = status;
  await listing.save();
  res.json({ success: true, data: listing });
});

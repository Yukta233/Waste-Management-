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

  const address = req.body.address ? (typeof req.body.address === 'string' ? JSON.parse(req.body.address || '{}') : req.body.address) : (user?.address || {});

  const images = [];
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
    // allow middleware to protect, but extra check
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

// Provider marks scheduled or completed
export const updateStatus = asyncHandler(async (req, res) => {
  const provider = req.user;
  const { status } = req.body; // 'scheduled' or 'completed' or 'cancelled'
  const listing = await SellWaste.findById(req.params.id);
  if (!listing) throw new ApiError(404, 'Listing not found');
  if (!String(listing.provider).startsWith(String(provider._id)) && String(listing.provider) !== String(provider._id)) {
    // allow provider who accepted
  }
  if (!['scheduled','completed','cancelled'].includes(status)) throw new ApiError(400, 'Invalid status');
  listing.status = status;
  await listing.save();
  res.json({ success: true, data: listing });
});

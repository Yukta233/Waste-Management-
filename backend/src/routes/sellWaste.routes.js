
import express from 'express';
import { verifyJWT, requireServiceProvider } from '../middleware/auth.middleware.js';
import { 
  createListing, 
  listOpen, 
  myListings, 
  providerOffer, 
  acceptOffer, 
  updateStatus, 
  providerAssigned,
  getListingById,
  cancelListing,
  providerOffered,
  getOffersForListing,
  rejectOffer,
  withdrawOffer,
  ratePickup,
  getProviderStats
} from '../controllers/sellWaste.controller.js';
import { uploadServiceImages, handleUploadError } from '../middleware/upload.middleware.js';

const router = express.Router();

// ============ PROTECTED ROUTES ============
router.use(verifyJWT); // All routes below require authentication

// IMPORTANT: Order matters! Static routes should come before dynamic routes

// User creates a listing (with image upload)
router.post(
  '/', 
  uploadServiceImages, 
  handleUploadError, 
  createListing
);

// User views their own listings (must come before /:id)
router.get('/my', myListings);

// ============ PROVIDER ROUTES ============
// Providers view open listings (must come before /:id)
router.get('/open', verifyJWT, requireServiceProvider, listOpen);

// Providers view listings where they've made offers
router.get('/provider/offered', verifyJWT, requireServiceProvider, providerOffered);

// Providers view listings assigned to them
router.get('/provider/assigned', verifyJWT, requireServiceProvider, providerAssigned);

// Provider dashboard statistics
router.get('/provider/stats', verifyJWT, requireServiceProvider, getProviderStats);

// ============ DYNAMIC ROUTES (come last) ============
// User gets offers for their listing
router.get('/:id/offers', getOffersForListing);

// User accepts an offer
router.post('/:id/accept', acceptOffer);

// User rejects an offer
router.post('/:id/reject-offer', rejectOffer);

// User rates completed pickup
router.post('/:id/rate', ratePickup);

// User cancels their own listing
router.post('/:id/cancel', cancelListing);

// Provider makes an offer
router.post('/:id/offer', verifyJWT, requireServiceProvider, providerOffer);

// Provider withdraws an offer
router.post('/:id/withdraw-offer', verifyJWT, requireServiceProvider, withdrawOffer);

// Provider updates status (scheduled/completed/cancelled)
router.post('/:id/status', verifyJWT, requireServiceProvider, updateStatus);

// User/Provider gets a specific listing by ID (should be LAST)
router.get('/:id', getListingById);

export default router;
import express from 'express';
import { verifyJWT, requireServiceProvider } from '../middleware/auth.middleware.js';
import { createListing, listOpen, myListings, providerOffer, acceptOffer, updateStatus, providerAssigned } from '../controllers/sellWaste.controller.js';
import { uploadServiceImages, handleUploadError } from '../middleware/upload.middleware.js';

const router = express.Router();

// Providers can list open requests (requires provider role)
router.get('/open', verifyJWT, requireServiceProvider, listOpen);

// Create listing (user) - allow images upload; do NOT cleanup files here to keep images persistent
router.post('/', verifyJWT, (uploadServiceImages.array ? uploadServiceImages.array('images', 5) : uploadServiceImages), handleUploadError, createListing);

// User's own listings
router.get('/my', verifyJWT, myListings);

// Provider: listings assigned to me (accepted/scheduled/completed)
router.get('/provider/assigned', verifyJWT, requireServiceProvider, providerAssigned);

// Provider offers price
router.post('/:id/offer', verifyJWT, requireServiceProvider, providerOffer);

// User accepts an offer
router.post('/:id/accept', verifyJWT, acceptOffer);

// Provider update status (scheduled/completed/cancelled)
router.post('/:id/status', verifyJWT, requireServiceProvider, updateStatus);

export default router;

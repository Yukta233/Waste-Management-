import express from 'express';
import { verifyJWT, requireServiceProvider } from '../middleware/auth.middleware.js';
import { createListing, listOpen, myListings, providerOffer, acceptOffer, updateStatus } from '../controllers/sellWaste.controller.js';
import { uploadServiceImages, handleUploadError, cleanupTempFiles } from '../middleware/upload.middleware.js';

const router = express.Router();

// Public for providers to list open requests (providers should call with JWT)
router.get('/open', verifyJWT, requireServiceProvider, listOpen);

// Create listing (user) - allow images upload
router.post('/', verifyJWT, uploadServiceImages.array ? uploadServiceImages.array('images', 5) : uploadServiceImages, handleUploadError, createListing, cleanupTempFiles);

// User's own listings
router.get('/my', verifyJWT, myListings);

// Provider offers price
router.post('/:id/offer', verifyJWT, requireServiceProvider, providerOffer);

// User accepts an offer
router.post('/:id/accept', verifyJWT, acceptOffer);

// Provider update status (scheduled/completed/cancelled)
router.post('/:id/status', verifyJWT, requireServiceProvider, updateStatus);

export default router;

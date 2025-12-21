import express from 'express';
import { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    forgotPassword,
    resetPassword
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {  uploadProfilePhoto, handleUploadError } from '../middleware/upload.middleware.js'; // ADD THIS

const router = express.Router();
router.options("/register", (req, res) => {
  res.sendStatus(200);
});

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// ============ PUBLIC ROUTES ============
router.post("/register", 
    uploadProfilePhoto,  // ADD THIS
    handleUploadError,   // ADD THIS
    registerUser
);
router.post("/login", loginUser);

// ============ PROTECTED ROUTES ============
router.use(verifyJWT); // All routes below require authentication

router.post("/logout", logoutUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/change-password", changeCurrentPassword);

export default router;
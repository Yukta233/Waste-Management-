import express from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { getNotifications, markAsRead } from '../controllers/notification.controller.js';

const router = express.Router();

router.use(verifyJWT);

router.get('/', getNotifications);
router.post('/:id/read', markAsRead);

export default router;

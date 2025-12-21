import express from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount
} from '../controllers/notification.controller.js';

const router = express.Router();

router.use(verifyJWT); // All routes below require authentication

// Get notifications with pagination
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark single notification as read
router.post('/:id/read', markAsRead);

// Mark all as read
router.post('/mark-all-read', markAllAsRead);

// Delete single notification
router.delete('/:id', deleteNotification);

// Clear all notifications
router.delete('/', clearAllNotifications);

export default router;
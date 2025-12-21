import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/User.model.js';
import { Booking } from '../models/Booking.model.js';
import { SellWaste } from '../models/SellWaste.model.js';

// Helper function to create notification
const createNotification = async (userId, notificationData) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          ...notificationData,
          read: false,
          createdAt: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Get user notifications with pagination
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const user = await User.findById(req.user._id).select('notifications');
  if (!user) throw new ApiError(404, 'User not found');

  let notifications = [...user.notifications].reverse(); // Latest first

  // Filter unread only if requested
  if (unreadOnly === 'true') {
    notifications = notifications.filter(n => !n.read);
  }

  // Apply pagination
  const paginatedNotifications = notifications.slice(skip, skip + parseInt(limit));
  const total = notifications.length;
  const totalUnread = notifications.filter(n => !n.read).length;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notifications: paginatedNotifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
          totalUnread
        }
      },
      'Notifications fetched successfully'
    )
  );
});

// Mark single notification as read
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  const notification = user.notifications.id(id);
  if (!notification) throw new ApiError(404, 'Notification not found');
  
  notification.read = true;
  await user.save();

  return res.status(200).json(new ApiResponse(200, notification, 'Marked as read'));
});

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  user.notifications.forEach(notification => {
    notification.read = true;
  });

  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, 'All notifications marked as read'));
});

// Delete a notification
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  user.notifications = user.notifications.filter(n => n._id.toString() !== id);
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, 'Notification deleted'));
});

// Clear all notifications
const clearAllNotifications = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  user.notifications = [];
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, 'All notifications cleared'));
});

// Get unread count only
const getUnreadCount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('notifications');
  if (!user) throw new ApiError(404, 'User not found');

  const unreadCount = user.notifications.filter(n => !n.read).length;

  return res.status(200).json(
    new ApiResponse(
      200,
      { unreadCount },
      'Unread count fetched'
    )
  );
});

// Notification creation functions for different events
export const notificationUtils = {
  // For new booking
  createBookingNotification: async (providerId, userId, bookingId, serviceTitle) => {
    await createNotification(providerId, {
      title: 'New Booking Request',
      message: `You have a new booking request for "${serviceTitle}"`,
      type: 'booking',
      action: 'booking_request',
      data: { bookingId, userId, serviceTitle }
    });
  },

  // For booking status update
  createBookingStatusNotification: async (userId, bookingId, status) => {
    await createNotification(userId, {
      title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your booking has been ${status}`,
      type: 'booking',
      action: 'booking_status',
      data: { bookingId, status }
    });
  },

  // For new sell waste offer
  createSellWasteOfferNotification: async (userId, listingId, providerName, price) => {
    await createNotification(userId, {
      title: 'New Offer for Your Waste',
      message: `${providerName} has made an offer of ₹${price} for your waste listing`,
      type: 'sell_waste',
      action: 'new_offer',
      data: { listingId, providerName, price }
    });
  },

  // For sell waste status update
  createSellWasteStatusNotification: async (userId, listingId, wasteType, status) => {
    await createNotification(userId, {
      title: `Waste Pickup ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your ${wasteType} waste pickup has been ${status}`,
      type: 'sell_waste',
      action: 'pickup_status',
      data: { listingId, wasteType, status }
    });
  },

  // For service approval/rejection
  createServiceStatusNotification: async (providerId, serviceTitle, status, reason = '') => {
    await createNotification(providerId, {
      title: `Service ${status === 'active' ? 'Approved' : 'Rejected'}`,
      message: `Your service "${serviceTitle}" has been ${status === 'active' ? 'approved and is now live' : 'rejected' + (reason ? `: ${reason}` : '')}`,
      type: 'service',
      action: 'service_status',
      data: { serviceTitle, status, reason }
    });
  },

  // General system notification
  createSystemNotification: async (userId, title, message, data = {}) => {
    await createNotification(userId, {
      title,
      message,
      type: 'system',
      action: 'system_message',
      data
    });
  }
};

export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount
};
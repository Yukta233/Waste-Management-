import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/User.model.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('notifications');
  if (!user) throw new ApiError(404, 'User not found');
  const notes = (user.notifications || []).slice().reverse();
  return res.status(200).json(new ApiResponse(200, notes, 'Notifications fetched'));
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');
  const note = user.notifications.id(id);
  if (!note) throw new ApiError(404, 'Notification not found');
  note.read = true;
  await user.save();
  return res.status(200).json(new ApiResponse(200, note, 'Marked as read'));
});

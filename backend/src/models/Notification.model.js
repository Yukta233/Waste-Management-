
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'sell_waste_offer',
      'sell_waste_status',
      'new_sell_request',
      'booking_update',
      'payment_update',
      'system_alert'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 });

export const Notification = mongoose.model('Notification', NotificationSchema);

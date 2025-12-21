
import { Notification } from '../models/Notification.model.js';

class NotificationUtils {
  // Create notification for sell waste offers
  async createSellWasteOfferNotification(userId, listingId, providerName, price) {
    try {
      await Notification.create({
        user: userId,
        type: 'sell_waste_offer',
        title: 'New Offer for Your Waste',
        message: `${providerName} has offered ₹${price} for your waste listing`,
        data: { listingId, providerName, price },
        read: false
      });
    } catch (error) {
      console.error('Error creating offer notification:', error);
    }
  }

  // Create notification for sell waste status changes
  async createSellWasteStatusNotification(userId, listingId, wasteType, status) {
    const statusMessages = {
      'accepted': 'Your offer has been accepted!',
      'rejected': 'Your offer has been rejected',
      'scheduled': 'Pickup has been scheduled',
      'completed': 'Pickup completed successfully',
      'cancelled': 'Pickup has been cancelled',
      'rated': 'You received a rating for your service',
      'offer_withdrawn': 'An offer has been withdrawn'
    };

    try {
      await Notification.create({
        user: userId,
        type: 'sell_waste_status',
        title: 'Waste Pickup Update',
        message: statusMessages[status] || `Status updated to ${status}`,
        data: { listingId, wasteType, status },
        read: false
      });
    } catch (error) {
      console.error('Error creating status notification:', error);
    }
  }

  // Create notification for new sell request for providers
  async createNewSellRequestNotification(providerId, listingId, wasteType, quantity, city) {
    try {
      await Notification.create({
        user: providerId,
        type: 'new_sell_request',
        title: 'New Waste Request Available',
        message: `New ${wasteType} request (${quantity}kg) in ${city}`,
        data: { listingId, wasteType, quantity, city },
        read: false
      });
    } catch (error) {
      console.error('Error creating new request notification:', error);
    }
  }
}

export const notificationUtils = new NotificationUtils();

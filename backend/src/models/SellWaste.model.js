import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const OfferSchema = new Schema({
  provider: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pricePerKg: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  message: { type: String },
  createdAt: { type: Date, default: Date.now },
  accepted: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
});

const SellWasteSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  wasteType: { 
    type: String, 
    required: true, 
    enum: ['plastic', 'paper', 'metal', 'e-waste', 'glass', 'organic', 'mixed', 'textile', 'hazardous']
  },
  quantityKg: { type: Number, required: true },
  address: { type: Schema.Types.Mixed, required: true },
  preferredPickupAt: { type: Date },
  images: { type: [String], default: [] },
  status: { 
    type: String, 
    enum: ['open', 'offered', 'accepted', 'scheduled', 'completed', 'cancelled', 'rejected'], 
    default: 'open' 
  },
  offers: { type: [OfferSchema], default: [] },
  acceptedOffer: { type: Schema.Types.ObjectId },
  provider: { type: Schema.Types.ObjectId, ref: 'User' },
  finalizedPrice: { type: Number },
  rejectionReason: { type: String },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  cancelledBy: { type: String, enum: ['user', 'provider', 'system'] },
  notes: { type: String }
}, { timestamps: true });

// Indexes for better query performance
SellWasteSchema.index({ user: 1, status: 1 });
SellWasteSchema.index({ provider: 1, status: 1 });
SellWasteSchema.index({ status: 1, createdAt: -1 });
SellWasteSchema.index({ 'location.city': 1, status: 1 });

export const SellWaste = mongoose.model('SellWaste', SellWasteSchema);

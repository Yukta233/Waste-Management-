import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const OfferSchema = new Schema({
  provider: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pricePerKg: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  message: { type: String },
  createdAt: { type: Date, default: Date.now },
  accepted: { type: Boolean, default: false }
});

const SellWasteSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  wasteType: { type: String, required: true, enum: ['plastic','paper','metal','e-waste','glass'] },
  quantityKg: { type: Number, required: true },
  address: { type: Schema.Types.Mixed, required: true },
  preferredPickupAt: { type: Date },
  images: { type: [String], default: [] },
  status: { type: String, enum: ['open','offered','accepted','scheduled','completed','cancelled'], default: 'open' },
  offers: { type: [OfferSchema], default: [] },
  acceptedOffer: { type: Schema.Types.ObjectId },
  provider: { type: Schema.Types.ObjectId, ref: 'User' },
  finalizedPrice: { type: Number },
}, { timestamps: true });

export const SellWaste = mongoose.model('SellWaste', SellWasteSchema);

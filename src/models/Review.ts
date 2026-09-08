import mongoose, { Schema, Document, Model } from 'mongoose';

export type ReviewStatus = 'PUBLISHED' | 'HIDDEN' | 'FLAGGED';

export interface IVendorReply {
  text: string;
  repliedAt: Date;
  updatedAt?: Date;
  repliedBy?: mongoose.Types.ObjectId;
}

export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerAvatar?: string;
  vehicleId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  overallRating: number; // 1 to 5
  vehicleConditionRating: number;
  vendorBehaviorRating: number;
  pickupExperienceRating: number;
  deliveryExperienceRating: number;
  pricingTransparencyRating?: number;
  reviewText: string;
  photos: string[];
  status: ReviewStatus;
  moderationReason?: string;
  moderatedAt?: Date;
  moderatedBy?: mongoose.Types.ObjectId;
  vendorReply?: IVendorReply;
  isVerifiedRental: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VendorReplySchema = new Schema<IVendorReply>(
  {
    text: { type: String, required: true, trim: true },
    repliedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    repliedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const ReviewSchema = new Schema<IReview>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true },
    customerAvatar: { type: String, default: '' },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    overallRating: { type: Number, required: true, min: 1, max: 5 },
    vehicleConditionRating: { type: Number, required: true, min: 1, max: 5 },
    vendorBehaviorRating: { type: Number, required: true, min: 1, max: 5 },
    pickupExperienceRating: { type: Number, required: true, min: 1, max: 5 },
    deliveryExperienceRating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    pricingTransparencyRating: { type: Number, min: 1, max: 5, default: 5 },
    reviewText: { type: String, required: true, trim: true },
    photos: [{ type: String }],
    status: {
      type: String,
      enum: ['PUBLISHED', 'HIDDEN', 'FLAGGED'],
      default: 'PUBLISHED',
      index: true,
    },
    moderationReason: { type: String, default: '' },
    moderatedAt: { type: Date },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    vendorReply: { type: VendorReplySchema },
    isVerifiedRental: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ vehicleId: 1, status: 1, overallRating: -1 });
ReviewSchema.index({ vendorId: 1, status: 1, overallRating: -1 });
ReviewSchema.index({ customerId: 1, createdAt: -1 });

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;

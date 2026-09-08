import mongoose, { Schema, Document, Model } from 'mongoose';

export type DiscountType = 'PERCENTAGE' | 'FLAT';

export interface ICoupon extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number; // percentage (e.g. 15 for 15%) or flat amount in INR
  minimumBookingValue: number;
  maximumDiscount: number; // cap on discount amount
  applicableCities: string[]; // empty array = all cities
  applicableVehicleCategories: Array<'SCOOTER' | 'MOTORCYCLE' | 'CAR' | 'EV'>; // empty = all
  expiryDate: Date;
  usageLimit: number;
  usageCount: number;
  perUserLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, required: true },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FLAT'],
      default: 'PERCENTAGE',
    },
    discountValue: { type: Number, required: true, min: 0 },
    minimumBookingValue: { type: Number, default: 0 },
    maximumDiscount: { type: Number, default: 500 },
    applicableCities: [{ type: String }],
    applicableVehicleCategories: [{ type: String, enum: ['SCOOTER', 'MOTORCYCLE', 'CAR', 'EV'] }],
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 1000 },
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);

export default Coupon;

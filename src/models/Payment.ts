import mongoose, { Schema, Document, Model } from 'mongoose';
import './User';
import './Vendor';
import './Booking';

export type PaymentProvider = 'RAZORPAY' | 'MOCK';

export type PaymentRecordStatus =
  | 'CREATED'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'SUCCESS'; // Backward compatibility alias for CAPTURED

export interface IPaymentBreakdown {
  basePrice: number;
  deliveryCharge: number;
  platformFee: number;
  gstTax: number;
  couponDiscount: number;
  securityDeposit: number;
  totalPayable: number;
}

export interface IRefundRecord {
  refundId: string;
  amount: number; // in INR
  reason: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  providerRefundId?: string;
  createdAt: Date;
}

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId;
  vehicleId?: mongoose.Types.ObjectId;
  amount: number; // in INR
  currency: string;
  provider: PaymentProvider;
  providerOrderId: string;
  providerPaymentId?: string;
  providerSignature?: string;
  signatureVerified: boolean;
  idempotencyKey?: string;
  reservationLockId?: string;
  status: PaymentRecordStatus;
  method?: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET';
  breakdown?: IPaymentBreakdown;
  failureReason?: string;
  refundStatus?: string;
  refundedAmount?: number;
  refunds?: IRefundRecord[];
  metadata?: Record<string, unknown>;
  notes?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentBreakdownSchema = new Schema<IPaymentBreakdown>(
  {
    basePrice: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    gstTax: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    securityDeposit: { type: Number, default: 1000 },
    totalPayable: { type: Number, required: true },
  },
  { _id: false }
);

const RefundRecordSchema = new Schema<IRefundRecord>(
  {
    refundId: { type: String, required: true },
    amount: { type: Number, required: true },
    reason: { type: String, default: '' },
    status: { type: String, enum: ['PENDING', 'PROCESSED', 'FAILED'], default: 'PROCESSED' },
    providerRefundId: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PaymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    provider: { type: String, enum: ['RAZORPAY', 'MOCK'], default: 'MOCK' },
    providerOrderId: { type: String, required: true, unique: true, index: true },
    providerPaymentId: { type: String, index: true },
    providerSignature: { type: String },
    signatureVerified: { type: Boolean, default: false },
    idempotencyKey: { type: String, sparse: true, index: true },
    reservationLockId: { type: String },
    status: {
      type: String,
      enum: ['CREATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'SUCCESS'],
      default: 'CREATED',
      index: true,
    },
    method: { type: String, enum: ['UPI', 'CARD', 'NETBANKING', 'WALLET'], default: 'UPI' },
    breakdown: { type: PaymentBreakdownSchema },
    failureReason: { type: String, default: '' },
    refundStatus: { type: String, default: 'NONE' },
    refundedAmount: { type: Number, default: 0 },
    refunds: [{ type: RefundRecordSchema }],
    metadata: { type: Schema.Types.Mixed },
    notes: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ customerId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;

import mongoose, { Schema, Document, Model } from 'mongoose';

export type PayoutStatus =
  | 'PENDING'
  | 'ELIGIBLE'
  | 'ON_HOLD'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'REVERSED';

export interface IPayout extends Document {
  _id: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  grossAmount: number;
  platformCommission: number;
  commissionPercentage: number;
  taxes: number;
  netAmount: number;
  status: PayoutStatus;
  idempotencyKey?: string;
  provider: 'MOCK' | 'RAZORPAY';
  providerReference?: string;
  providerTransferId?: string;
  bankAccountRef?: string;
  holdReason?: string;
  notes?: string;
  settlementDate?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema = new Schema<IPayout>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true, index: true },
    grossAmount: { type: Number, required: true },
    platformCommission: { type: Number, required: true },
    commissionPercentage: { type: Number, required: true, default: 15 },
    taxes: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'ELIGIBLE', 'ON_HOLD', 'PROCESSING', 'PAID', 'FAILED', 'REVERSED'],
      default: 'PENDING',
      index: true,
    },
    idempotencyKey: { type: String, unique: true, sparse: true },
    provider: { type: String, enum: ['MOCK', 'RAZORPAY'], default: 'MOCK' },
    providerReference: { type: String, default: '' },
    providerTransferId: { type: String, default: '' },
    bankAccountRef: { type: String, default: '' },
    holdReason: { type: String, default: '' },
    notes: { type: String, default: '' },
    settlementDate: { type: Date },
    paidAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const Payout: Model<IPayout> =
  mongoose.models.Payout || mongoose.model<IPayout>('Payout', PayoutSchema);

export default Payout;

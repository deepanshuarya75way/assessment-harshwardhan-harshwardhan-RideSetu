import mongoose, { Schema, Document, Model } from 'mongoose';

export type PayoutMethod = 'BANK_ACCOUNT' | 'UPI';
export type PayoutVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type PayoutProviderType = 'MOCK' | 'RAZORPAY';

export interface IVendorPayoutProfile extends Document {
  _id: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  beneficiaryName: string;
  payoutMethod: PayoutMethod;
  bankName?: string;
  accountNumberEncrypted?: string; // AES-256-GCM encrypted payload
  maskedAccountNumber?: string; // e.g. "•••• •••• 1234"
  ifscCode?: string;
  upiId?: string; // e.g. "partner@okhdfcbank"
  accountType?: 'SAVINGS' | 'CURRENT';
  provider: PayoutProviderType;
  providerAccountId?: string; // Razorpay Linked Account / Fund Account ID
  verificationStatus: PayoutVerificationStatus;
  verificationNotes?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VendorPayoutProfileSchema = new Schema<IVendorPayoutProfile>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      unique: true,
      index: true,
    },
    beneficiaryName: {
      type: String,
      required: true,
      trim: true,
    },
    payoutMethod: {
      type: String,
      enum: ['BANK_ACCOUNT', 'UPI'],
      default: 'BANK_ACCOUNT',
      required: true,
    },
    bankName: { type: String, default: '', trim: true },
    accountNumberEncrypted: { type: String, default: '' },
    maskedAccountNumber: { type: String, default: '', trim: true },
    ifscCode: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    upiId: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    accountType: {
      type: String,
      enum: ['SAVINGS', 'CURRENT'],
      default: 'CURRENT',
    },
    provider: {
      type: String,
      enum: ['MOCK', 'RAZORPAY'],
      default: 'MOCK',
    },
    providerAccountId: { type: String, default: '' },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    verificationNotes: { type: String, default: '' },
    verifiedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const VendorPayoutProfile: Model<IVendorPayoutProfile> =
  mongoose.models.VendorPayoutProfile ||
  mongoose.model<IVendorPayoutProfile>('VendorPayoutProfile', VendorPayoutProfileSchema);

export default VendorPayoutProfile;

import mongoose, { Schema, Document, Model } from 'mongoose';

export type VendorVerificationStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ACTION_REQUIRED'
  | 'SUSPENDED';

export interface IVendor extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  destinationId?: mongoose.Types.ObjectId;
  businessType: 'INDIVIDUAL' | 'PROPRIETORSHIP' | 'PARTNERSHIP' | 'PVT_LTD';
  gstNumber?: string;
  rentalLicenseNumber: string;
  businessDescription?: string;
  yearsInBusiness?: number;
  operatingHours?: {
    open: string;
    close: string;
    days: string;
  };
  pickupInstructions?: string;
  verificationStatus: VendorVerificationStatus;
  rejectionReason?: string;
  suspendedReason?: string;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  rating: number;
  totalReviews: number;
  commissionRate: number; // e.g., 15 for 15%
  deliveryRadiusKm: number;
  baseDeliveryFee: number;
  hubPickupAvailable?: boolean;
  doorstepDeliveryAvailable?: boolean;
  hostelDeliveryAvailable?: boolean;
  bankAccountReference?: string; // Stored securely / tokenized
  documents: {
    tradeLicenseUrl?: string;
    gstCertificateUrl?: string;
    identityProofUrl?: string;
    rentalPermitUrl?: string;
  };
  documentStatus?: {
    tradeLicense?: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
    gstCertificate?: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
    identityProof?: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
    rentalPermit?: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  };
  isActive: boolean;
  isTopRated: boolean;
  cancellationCount: number;
  completedBookingsCount: number;
  reliabilityScore: number; // 0 to 100
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    businessName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: 'Uttarakhand' },
    pincode: { type: String, default: '' },
    destinationId: { type: Schema.Types.ObjectId, ref: 'Destination', index: true },
    businessType: {
      type: String,
      enum: ['INDIVIDUAL', 'PROPRIETORSHIP', 'PARTNERSHIP', 'PVT_LTD'],
      default: 'PROPRIETORSHIP',
    },
    gstNumber: { type: String, default: '' },
    rentalLicenseNumber: { type: String, default: 'PENDING_REGISTRATION', trim: true },
    businessDescription: { type: String, default: '' },
    yearsInBusiness: { type: Number, default: 1 },
    operatingHours: {
      open: { type: String, default: '08:00 AM' },
      close: { type: String, default: '09:00 PM' },
      days: { type: String, default: 'Mon - Sun' },
    },
    pickupInstructions: { type: String, default: '' },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'ACTION_REQUIRED', 'SUSPENDED'],
      default: 'PENDING',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    suspendedReason: { type: String, default: '' },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, default: 4.8, min: 1, max: 5 },
    totalReviews: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 15, min: 0, max: 50 },
    deliveryRadiusKm: { type: Number, default: 15 },
    baseDeliveryFee: { type: Number, default: 100 },
    bankAccountReference: { type: String, default: '' },
    documents: {
      tradeLicenseUrl: { type: String, default: '' },
      gstCertificateUrl: { type: String, default: '' },
      identityProofUrl: { type: String, default: '' },
      rentalPermitUrl: { type: String, default: '' },
    },
    documentStatus: {
      tradeLicense: { type: String, enum: ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
      gstCertificate: { type: String, enum: ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
      identityProof: { type: String, enum: ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
      rentalPermit: { type: String, enum: ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    },
    isActive: { type: Boolean, default: true },
    isTopRated: { type: Boolean, default: false },
    cancellationCount: { type: Number, default: 0 },
    completedBookingsCount: { type: Number, default: 0 },
    reliabilityScore: { type: Number, default: 98, min: 0, max: 100 },
  },
  {
    timestamps: true,
  }
);

VendorSchema.index({ destinationId: 1, verificationStatus: 1, rating: -1 });

export const Vendor: Model<IVendor> =
  mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);

export default Vendor;

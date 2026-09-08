import mongoose, { Schema, Document, Model } from 'mongoose';
import './User';

export type KYCVerificationStatus =
  | 'NOT_STARTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ACTION_REQUIRED';

export type KYCDocumentType =
  | 'DRIVING_LICENCE'
  | 'AADHAAR'
  | 'PASSPORT'
  | 'VOTER_ID';

export interface IKYCVerification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: KYCVerificationStatus;
  documentType: KYCDocumentType;
  licenceNumberEncrypted: string;
  maskedLicenceNumber: string;
  nameOnLicence: string;
  dateOfBirth: Date;
  issueDate: Date;
  expiryDate: Date;
  vehicleClasses: string[]; // e.g. ['MCWG', 'LMV', 'MCWOG']
  documentFrontStorageKey: string;
  documentBackStorageKey: string;
  verificationMethod: 'ADMIN_REVIEW' | 'AUTOMATED_PROVIDER';
  verificationProvider: string; // 'ADMIN_REVIEW' | 'SUREPASS' | 'DIGILOCKER'
  verificationReference: string;
  submittedAt: Date;
  verifiedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  adminNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reverificationRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const KYCVerificationSchema = new Schema<IKYCVerification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'ACTION_REQUIRED'],
      default: 'NOT_STARTED',
      index: true,
    },
    documentType: {
      type: String,
      enum: ['DRIVING_LICENCE', 'AADHAAR', 'PASSPORT', 'VOTER_ID'],
      default: 'DRIVING_LICENCE',
    },
    licenceNumberEncrypted: { type: String, default: '' },
    maskedLicenceNumber: { type: String, default: '' },
    nameOnLicence: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true, index: true },
    vehicleClasses: {
      type: [String],
      default: ['MCWG'], // Motorcycle with Gear / Scooter
    },
    documentFrontStorageKey: { type: String, required: true },
    documentBackStorageKey: { type: String, required: true },
    verificationMethod: {
      type: String,
      enum: ['ADMIN_REVIEW', 'AUTOMATED_PROVIDER'],
      default: 'ADMIN_REVIEW',
    },
    verificationProvider: {
      type: String,
      default: 'ADMIN_REVIEW',
    },
    verificationReference: {
      type: String,
      required: true,
      index: true,
    },
    submittedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reverificationRequired: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

KYCVerificationSchema.index({ userId: 1, createdAt: -1 });
KYCVerificationSchema.index({ status: 1, submittedAt: -1 });

export const KYCVerification: Model<IKYCVerification> =
  mongoose.models.KYCVerification || mongoose.model<IKYCVerification>('KYCVerification', KYCVerificationSchema);

export default KYCVerification;

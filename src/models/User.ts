import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN';
export type KYCStatus =
  | 'NOT_STARTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ACTION_REQUIRED'
  | 'PENDING'; // Kept for backwards compatibility

export type AuthProviderType = 'PASSWORD' | 'GOOGLE' | 'OTP';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  kycStatus: KYCStatus;
  drivingLicenseStatus: KYCStatus;
  drivingLicenseNumber?: string;
  drivingLicenseExpiry?: Date;
  aadhaarStatus?: KYCStatus;
  aadhaarNumberMasked?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  googleId?: string;
  googleEmail?: string;
  googleProfileImage?: string;
  authProviders?: AuthProviderType[];
  dateOfBirth?: Date;
  gender?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: false, default: '', trim: true },
    passwordHash: { type: String, required: false, default: '' },
    role: {
      type: String,
      enum: ['CUSTOMER', 'VENDOR', 'ADMIN'],
      default: 'CUSTOMER',
      index: true,
    },
    avatar: { type: String, default: '' },
    kycStatus: {
      type: String,
      enum: ['NOT_STARTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'ACTION_REQUIRED', 'PENDING'],
      default: 'NOT_STARTED',
      index: true,
    },
    drivingLicenseStatus: {
      type: String,
      enum: ['NOT_STARTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'ACTION_REQUIRED', 'PENDING'],
      default: 'NOT_STARTED',
    },
    drivingLicenseNumber: { type: String, default: '' },
    drivingLicenseExpiry: { type: Date },
    aadhaarStatus: {
      type: String,
      enum: ['NOT_STARTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'ACTION_REQUIRED', 'PENDING'],
      default: 'NOT_STARTED',
    },
    aadhaarNumberMasked: { type: String, default: '' },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    googleId: { type: String, index: true, sparse: true },
    googleEmail: { type: String, lowercase: true, trim: true },
    googleProfileImage: { type: String, default: '' },
    authProviders: [{ type: String, enum: ['PASSWORD', 'GOOGLE', 'OTP'] }],
    dateOfBirth: { type: Date },
    gender: { type: String, default: '' },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relation: { type: String, default: '' },
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

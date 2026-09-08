import mongoose, { Schema, Document, Model } from 'mongoose';
import './User';

export type CustomerVehicleType = 'SCOOTER' | 'BIKE' | 'CAR';

export type CustomerVehicleVerificationStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ACTION_REQUIRED';

export type DrivingLicenseDocumentStatus =
  | 'PENDING'
  | 'UPLOADED'
  | 'VERIFIED'
  | 'REJECTED';

export interface ICustomerVehicle {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  vehicleType: CustomerVehicleType;
  brand: string;
  model: string;
  variant?: string;
  registrationNumber: string;
  drivingLicenseNumber: string;
  drivingLicenseDocumentUrl: string;
  drivingLicenseDocumentStorageKey?: string;
  drivingLicenseDocumentStatus: DrivingLicenseDocumentStatus;
  verificationStatus: CustomerVehicleVerificationStatus;
  rejectionReason?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerVehicleSchema = new Schema<ICustomerVehicle>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicleType: {
      type: String,
      enum: ['SCOOTER', 'BIKE', 'CAR'],
      required: true,
    },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    variant: { type: String, default: '', trim: true },
    registrationNumber: { type: String, required: true, trim: true, uppercase: true, index: true },
    drivingLicenseNumber: { type: String, required: true, trim: true, uppercase: true },
    drivingLicenseDocumentUrl: { type: String, required: true },
    drivingLicenseDocumentStorageKey: { type: String, default: '' },
    drivingLicenseDocumentStatus: {
      type: String,
      enum: ['PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED'],
      default: 'UPLOADED',
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'ACTION_REQUIRED'],
      default: 'VERIFIED',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

CustomerVehicleSchema.index({ userId: 1, isActive: 1 });
CustomerVehicleSchema.index({ registrationNumber: 1 });

export const CustomerVehicle: Model<ICustomerVehicle> =
  mongoose.models.CustomerVehicle ||
  mongoose.model<ICustomerVehicle>('CustomerVehicle', CustomerVehicleSchema);

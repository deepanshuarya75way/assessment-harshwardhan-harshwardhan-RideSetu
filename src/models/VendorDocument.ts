import mongoose, { Schema, Document, Model } from 'mongoose';

export type VendorDocType =
  | 'TRADE_LICENSE'
  | 'GST_CERTIFICATE'
  | 'OWNER_ID'
  | 'RENTAL_PERMIT'
  | 'VEHICLE_RC'
  | 'VEHICLE_INSURANCE'
  | 'VEHICLE_PUC'
  | 'VEHICLE_PERMIT';

export type VendorDocStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface IVendorDocument extends Document {
  _id: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  vehicleId?: mongoose.Types.ObjectId;
  docType: VendorDocType;
  originalFileName: string;
  storageKey: string;
  fileSize: number;
  mimeType: string;
  status: VendorDocStatus;
  rejectionReason?: string;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VendorDocumentSchema = new Schema<IVendorDocument>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', index: true },
    docType: {
      type: String,
      enum: [
        'TRADE_LICENSE',
        'GST_CERTIFICATE',
        'OWNER_ID',
        'RENTAL_PERMIT',
        'VEHICLE_RC',
        'VEHICLE_INSURANCE',
        'VEHICLE_PUC',
        'VEHICLE_PERMIT',
      ],
      required: true,
      index: true,
    },
    originalFileName: { type: String, required: true },
    storageKey: { type: String, required: true, unique: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'],
      default: 'UNDER_REVIEW',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

VendorDocumentSchema.index({ vendorId: 1, docType: 1 });

export const VendorDocument: Model<IVendorDocument> =
  mongoose.models.VendorDocument ||
  mongoose.model<IVendorDocument>('VendorDocument', VendorDocumentSchema);

export default VendorDocument;

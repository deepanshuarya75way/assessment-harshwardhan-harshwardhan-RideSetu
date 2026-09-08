import mongoose, { Schema, Document, Model } from 'mongoose';

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export type DisputeCategory =
  | 'DAMAGE_CHARGE'
  | 'VEHICLE_CONDITION'
  | 'VENDOR_BEHAVIOR'
  | 'PICKUP_ISSUE'
  | 'DELIVERY_ISSUE'
  | 'PAYMENT_ISSUE'
  | 'REFUND_ISSUE'
  | 'OTHER';

export interface IDispute extends Document {
  _id: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  category: DisputeCategory;
  raisedBy: 'CUSTOMER' | 'VENDOR';
  status: DisputeStatus;
  claimedAmount: number;
  deductedAmount: number;
  description?: string;
  evidence: {
    beforePhotos?: string[];
    afterPhotos?: string[];
    evidencePhotos?: string[];
    handoverReports?: mongoose.Types.ObjectId[];
  };
  vendorRemarks?: string;
  customerRemarks?: string;
  customerRebuttal?: string;
  adminNotes?: string;
  resolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DisputeSchema = new Schema<IDispute>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      enum: [
        'DAMAGE_CHARGE',
        'VEHICLE_CONDITION',
        'VENDOR_BEHAVIOR',
        'PICKUP_ISSUE',
        'DELIVERY_ISSUE',
        'PAYMENT_ISSUE',
        'REFUND_ISSUE',
        'OTHER',
      ],
      default: 'DAMAGE_CHARGE',
      index: true,
    },
    raisedBy: {
      type: String,
      enum: ['CUSTOMER', 'VENDOR'],
      default: 'VENDOR',
    },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
      default: 'OPEN',
      index: true,
    },
    claimedAmount: { type: Number, default: 0 },
    deductedAmount: { type: Number, default: 0 },
    description: { type: String, default: '' },
    evidence: {
      beforePhotos: [{ type: String }],
      afterPhotos: [{ type: String }],
      evidencePhotos: [{ type: String }],
      handoverReports: [{ type: Schema.Types.ObjectId, ref: 'DigitalHandoverReport' }],
    },
    vendorRemarks: { type: String, default: '' },
    customerRemarks: { type: String, default: '' },
    customerRebuttal: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
    resolution: { type: String, default: '' },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

DisputeSchema.index({ customerId: 1, createdAt: -1 });
DisputeSchema.index({ vendorId: 1, status: 1 });

export const Dispute: Model<IDispute> =
  mongoose.models.Dispute || mongoose.model<IDispute>('Dispute', DisputeSchema);

export default Dispute;

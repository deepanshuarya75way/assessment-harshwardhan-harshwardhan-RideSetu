import mongoose, { Schema, Document, Model } from 'mongoose';

export type DamageReportStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export interface IDamageReport extends Document {
  _id: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  beforePhotos: string[];
  afterPhotos: string[];
  description: string;
  claimedAmount: number;
  deductedAmount: number;
  status: DamageReportStatus;
  vendorRemarks: string;
  customerResponse?: string;
  adminNotes?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

const DamageReportSchema = new Schema<IDamageReport>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    beforePhotos: [{ type: String }],
    afterPhotos: [{ type: String }],
    description: { type: String, required: true },
    claimedAmount: { type: Number, required: true, min: 0 },
    deductedAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
      default: 'OPEN',
      index: true,
    },
    vendorRemarks: { type: String, default: '' },
    customerResponse: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const DamageReport: Model<IDamageReport> =
  mongoose.models.DamageReport || mongoose.model<IDamageReport>('DamageReport', DamageReportSchema);

export default DamageReport;

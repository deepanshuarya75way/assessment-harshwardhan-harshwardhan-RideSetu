import mongoose, { Schema, Document, Model } from 'mongoose';

export type HandoverType = 'PICKUP' | 'RETURN';

export interface IScratchItem {
  id: string;
  zone: string; // e.g. 'Front Mudguard', 'Left Body Panel', 'Exhaust', 'Handlebar'
  description: string;
  severity: 'MINOR' | 'MODERATE' | 'MAJOR';
  photoUrl?: string;
}

export interface IDigitalHandoverReport extends Document {
  _id: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  handoverType: HandoverType;
  odometerReading: number;
  fuelBatteryLevel: number; // 0 to 100 percentage
  existingScratches: IScratchItem[];
  photos: {
    frontUrl: string;
    backUrl: string;
    leftUrl: string;
    rightUrl: string;
    meterUrl: string;
  };
  helmetCount: number;
  accessoriesGiven: string[]; // e.g., 'Toolkit', 'First Aid', 'Pillion Helmet', 'Mobile Mount'
  customerSignatureConfirmed: boolean;
  customerSignatureName?: string;
  vendorAgentName: string;
  remarks: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DigitalHandoverReportSchema = new Schema<IDigitalHandoverReport>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    handoverType: {
      type: String,
      enum: ['PICKUP', 'RETURN'],
      required: true,
    },
    odometerReading: { type: Number, required: true },
    fuelBatteryLevel: { type: Number, required: true, min: 0, max: 100 },
    existingScratches: [
      {
        id: { type: String, required: true },
        zone: { type: String, required: true },
        description: { type: String, required: true },
        severity: { type: String, enum: ['MINOR', 'MODERATE', 'MAJOR'], default: 'MINOR' },
        photoUrl: { type: String, default: '' },
      },
    ],
    photos: {
      frontUrl: { type: String, default: '' },
      backUrl: { type: String, default: '' },
      leftUrl: { type: String, default: '' },
      rightUrl: { type: String, default: '' },
      meterUrl: { type: String, default: '' },
    },
    helmetCount: { type: Number, default: 1 },
    accessoriesGiven: [{ type: String }],
    customerSignatureConfirmed: { type: Boolean, default: true },
    customerSignatureName: { type: String, default: '' },
    vendorAgentName: { type: String, required: true, default: 'RideSetu Partner Agent' },
    remarks: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

DigitalHandoverReportSchema.index({ bookingId: 1, handoverType: 1 });

export const DigitalHandoverReport: Model<IDigitalHandoverReport> =
  mongoose.models.DigitalHandoverReport ||
  mongoose.model<IDigitalHandoverReport>('DigitalHandoverReport', DigitalHandoverReportSchema);

export default DigitalHandoverReport;

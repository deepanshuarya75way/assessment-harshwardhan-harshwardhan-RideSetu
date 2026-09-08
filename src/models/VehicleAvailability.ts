import mongoose, { Schema, Document, Model } from 'mongoose';

export type BlockReason = 'BOOKED' | 'MAINTENANCE' | 'MANUAL_BLOCK' | 'PERSONAL_USE';

export interface IVehicleAvailability extends Document {
  _id: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason: BlockReason;
  bookingId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleAvailabilitySchema = new Schema<IVehicleAvailability>(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: {
      type: String,
      enum: ['BOOKED', 'MAINTENANCE', 'MANUAL_BLOCK', 'PERSONAL_USE'],
      required: true,
      default: 'MANUAL_BLOCK',
    },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

VehicleAvailabilitySchema.index({ vehicleId: 1, startDate: 1, endDate: 1 });

export const VehicleAvailability: Model<IVehicleAvailability> =
  mongoose.models.VehicleAvailability ||
  mongoose.model<IVehicleAvailability>('VehicleAvailability', VehicleAvailabilitySchema);

export default VehicleAvailability;

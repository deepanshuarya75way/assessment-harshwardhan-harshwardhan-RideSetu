import mongoose, { Schema, Document, Model } from 'mongoose';

export type ReservationStatus = 'HOLD' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED';

export interface IReservationLock extends Document {
  _id: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  pickupDateTime: Date;
  returnDateTime: Date;
  status: ReservationStatus;
  sessionToken: string;
  bookingId?: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationLockSchema = new Schema<IReservationLock>(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    pickupDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    returnDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['HOLD', 'CONFIRMED', 'RELEASED', 'EXPIRED'],
      default: 'HOLD',
      required: true,
      index: true,
    },
    sessionToken: {
      type: String,
      required: true,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '15m' }, // TTL index auto-cleans unconfirmed holds
    },
  },
  {
    timestamps: true,
  }
);

// High-speed compound indexes for distributed overlap detection across instances
ReservationLockSchema.index({ vehicleId: 1, pickupDateTime: 1, returnDateTime: 1, status: 1 });
ReservationLockSchema.index({ vehicleId: 1, status: 1, expiresAt: 1 });
ReservationLockSchema.index({ userId: 1, vehicleId: 1, status: 1 });

export const ReservationLock: Model<IReservationLock> =
  mongoose.models.ReservationLock ||
  mongoose.model<IReservationLock>('ReservationLock', ReservationLockSchema);

export default ReservationLock;

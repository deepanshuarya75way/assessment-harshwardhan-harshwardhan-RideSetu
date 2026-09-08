import mongoose, { Schema, Document, Model } from 'mongoose';

export type LocationSourceRole = 'VENDOR' | 'CUSTOMER';
export type DeliveryState = 'ASSIGNED' | 'EN_ROUTE' | 'NEAR_DESTINATION' | 'ARRIVED' | 'HANDOVER_READY' | 'COMPLETED' | 'CANCELLED';

export interface ITripLocation extends Document {
  _id: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: LocationSourceRole;
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  consentGranted: boolean;
  deliveryState?: DeliveryState;
  isMock?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TripLocationSchema = new Schema<ITripLocation>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['VENDOR', 'CUSTOMER'], required: true },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    accuracy: { type: Number, required: true, min: 0 },
    heading: { type: Number, default: 0, min: 0, max: 360 },
    speed: { type: Number, default: 0, min: 0, max: 250 },
    timestamp: { type: Date, default: Date.now, index: true },
    consentGranted: { type: Boolean, default: true },
    deliveryState: {
      type: String,
      enum: ['ASSIGNED', 'EN_ROUTE', 'NEAR_DESTINATION', 'ARRIVED', 'HANDOVER_READY', 'COMPLETED', 'CANCELLED'],
      default: 'EN_ROUTE',
    },
    isMock: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

TripLocationSchema.index({ bookingId: 1, timestamp: -1 });
TripLocationSchema.index({ userId: 1, timestamp: -1 });
// TTL index to automatically prune high-frequency telemetry older than 30 days
TripLocationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const TripLocation: Model<ITripLocation> =
  mongoose.models.TripLocation || mongoose.model<ITripLocation>('TripLocation', TripLocationSchema);

export default TripLocation;

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPickupLocation extends Document {
  _id: mongoose.Types.ObjectId;
  destinationId: mongoose.Types.ObjectId;
  name: string;
  landmark: string;
  address: string;
  latitude: number;
  longitude: number;
  isVendorHub: boolean;
  isDeliveryPoint: boolean;
  deliveryType?: 'HOTEL' | 'HOSTEL' | 'STATION' | 'AIRPORT' | 'CUSTOM';
  createdAt: Date;
  updatedAt: Date;
}

const PickupLocationSchema = new Schema<IPickupLocation>(
  {
    destinationId: { type: Schema.Types.ObjectId, ref: 'Destination', required: true, index: true },
    name: { type: String, required: true, trim: true },
    landmark: { type: String, default: '' },
    address: { type: String, required: true },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    isVendorHub: { type: Boolean, default: true },
    isDeliveryPoint: { type: Boolean, default: false },
    deliveryType: {
      type: String,
      enum: ['HOTEL', 'HOSTEL', 'STATION', 'AIRPORT', 'CUSTOM'],
      default: 'HOTEL',
    },
  },
  {
    timestamps: true,
  }
);

PickupLocationSchema.index({ destinationId: 1, isVendorHub: 1 });

export const PickupLocation: Model<IPickupLocation> =
  mongoose.models.PickupLocation ||
  mongoose.model<IPickupLocation>('PickupLocation', PickupLocationSchema);

export default PickupLocation;

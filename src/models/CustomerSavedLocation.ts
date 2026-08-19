import mongoose, { Schema, Document, Model } from 'mongoose';

export type SavedLocationType = 'VENDOR_PICKUP' | 'DOORSTEP' | 'HOTEL' | 'HOSTEL' | 'OTHER';
export type SavedLocationSource = 'CURRENT_LOCATION' | 'GOOGLE_PLACE' | 'MAP_PIN' | 'MANUAL';

export interface ICustomerSavedLocation extends Document {
  _id: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  label: string; // e.g. 'Home', 'Zostel Rishikesh', 'Hotel Ganga Kinare', 'Office'
  locationType: SavedLocationType;
  locationSource: SavedLocationSource;
  address: string;
  houseOrRoom?: string; // Room #, Flat #, House #
  buildingName?: string; // Hotel name, Hostel name, Apartment name
  landmark?: string;
  city: string;
  state: string;
  country: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  formattedAddress?: string;
  contactName?: string;
  contactPhone?: string;
  deliveryInstructions?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSavedLocationSchema = new Schema<ICustomerSavedLocation>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    locationType: {
      type: String,
      enum: ['VENDOR_PICKUP', 'DOORSTEP', 'HOTEL', 'HOSTEL', 'OTHER'],
      default: 'DOORSTEP',
    },
    locationSource: {
      type: String,
      enum: ['CURRENT_LOCATION', 'GOOGLE_PLACE', 'MAP_PIN', 'MANUAL'],
      default: 'MANUAL',
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    houseOrRoom: { type: String, default: '', trim: true },
    buildingName: { type: String, default: '', trim: true },
    landmark: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: 'Uttarakhand', trim: true },
    country: { type: String, default: 'India', trim: true },
    pincode: { type: String, default: '', trim: true },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    placeId: { type: String, default: '' },
    formattedAddress: { type: String, default: '' },
    contactName: { type: String, default: '', trim: true },
    contactPhone: { type: String, default: '', trim: true },
    deliveryInstructions: { type: String, default: '', trim: true },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

CustomerSavedLocationSchema.index({ customerId: 1, isDefault: -1 });

export const CustomerSavedLocation: Model<ICustomerSavedLocation> =
  mongoose.models.CustomerSavedLocation ||
  mongoose.model<ICustomerSavedLocation>('CustomerSavedLocation', CustomerSavedLocationSchema);

export default CustomerSavedLocation;

import mongoose, { Schema, Document, Model } from 'mongoose';
import './User';
import './Vehicle';
import './Vendor';

export type RiderVerificationStatus =
  | 'NOT_STARTED'
  | 'DOCUMENT_UPLOADED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED';

export type GroupBookingStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'CONFIRMED'
  | 'CANCELLED';

export type GroupPaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export interface IRiderDetails {
  fullName: string;
  drivingLicenseNumber: string;
  drivingLicenseDocumentUrl?: string;
  drivingLicenseDocumentKey?: string;
  verificationStatus: RiderVerificationStatus;
  rejectionReason?: string;
  verifiedAt?: Date;
}

export interface IGroupVehicleItem {
  vehicleId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  rider: IRiderDetails;
  pricing: {
    basePrice: number;
    deliveryCharge: number;
    platformFee: number;
    taxes: number;
    securityDeposit: number;
    totalPayable: number;
  };
}

export interface IGroupBooking extends Document {
  _id: mongoose.Types.ObjectId;
  groupBookingId: string;
  customerId: mongoose.Types.ObjectId;
  vehicles: IGroupVehicleItem[];
  pickupDateTime: Date;
  returnDateTime: Date;
  pickupType: 'VENDOR_PICKUP' | 'HOTEL_DELIVERY' | 'HOSTEL_DELIVERY' | 'STATION_DELIVERY' | 'AIRPORT_DELIVERY' | 'ONE_WAY_DROP';
  pickupLocation: string;
  dropoffLocation: string;
  deliveryLocation?: {
    locationType?: 'VENDOR_PICKUP' | 'DOORSTEP' | 'HOTEL' | 'HOSTEL' | 'OTHER';
    locationSource?: 'CURRENT_LOCATION' | 'GOOGLE_PLACE' | 'MAP_PIN' | 'MANUAL';
    address?: string;
    houseOrRoom?: string;
    buildingName?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
    formattedAddress?: string;
  };
  pricingSummary: {
    totalBasePrice: number;
    totalDeliveryCharge: number;
    totalPlatformFee: number;
    totalTaxes: number;
    totalSecurityDeposit: number;
    grandTotal: number;
  };
  bookingStatus: GroupBookingStatus;
  paymentStatus: GroupPaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RiderDetailsSchema = new Schema<IRiderDetails>({
  fullName: { type: String, default: '', trim: true },
  drivingLicenseNumber: { type: String, default: '', trim: true, uppercase: true },
  drivingLicenseDocumentUrl: { type: String, default: '' },
  drivingLicenseDocumentKey: { type: String, default: '' },
  verificationStatus: {
    type: String,
    enum: ['NOT_STARTED', 'DOCUMENT_UPLOADED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'],
    default: 'NOT_STARTED',
  },
  rejectionReason: { type: String, default: '' },
  verifiedAt: { type: Date },
});

const GroupVehicleItemSchema = new Schema<IGroupVehicleItem>({
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
  rider: { type: RiderDetailsSchema, required: true },
  pricing: {
    basePrice: { type: Number, required: true, default: 0 },
    deliveryCharge: { type: Number, required: true, default: 0 },
    platformFee: { type: Number, required: true, default: 49 },
    taxes: { type: Number, required: true, default: 0 },
    securityDeposit: { type: Number, required: true, default: 1000 },
    totalPayable: { type: Number, required: true, default: 0 },
  },
});

const GroupBookingSchema = new Schema<IGroupBooking>(
  {
    groupBookingId: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicles: { type: [GroupVehicleItemSchema], default: [] },
    pickupDateTime: { type: Date, required: true, index: true },
    returnDateTime: { type: Date, required: true, index: true },
    pickupType: {
      type: String,
      enum: ['VENDOR_PICKUP', 'HOTEL_DELIVERY', 'HOSTEL_DELIVERY', 'STATION_DELIVERY', 'AIRPORT_DELIVERY', 'ONE_WAY_DROP'],
      default: 'VENDOR_PICKUP',
    },
    pickupLocation: { type: String, required: true },
    dropoffLocation: { type: String, required: true },
    deliveryLocation: {
      locationType: { type: String, default: 'VENDOR_PICKUP' },
      locationSource: { type: String, default: 'MANUAL' },
      address: { type: String, default: '' },
      houseOrRoom: { type: String, default: '' },
      buildingName: { type: String, default: '' },
      landmark: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: 'Uttarakhand' },
      pincode: { type: String, default: '' },
      latitude: { type: Number },
      longitude: { type: Number },
      placeId: { type: String, default: '' },
      formattedAddress: { type: String, default: '' },
    },
    pricingSummary: {
      totalBasePrice: { type: Number, required: true, default: 0 },
      totalDeliveryCharge: { type: Number, required: true, default: 0 },
      totalPlatformFee: { type: Number, required: true, default: 0 },
      totalTaxes: { type: Number, required: true, default: 0 },
      totalSecurityDeposit: { type: Number, required: true, default: 0 },
      grandTotal: { type: Number, required: true, default: 0 },
    },
    bookingStatus: {
      type: String,
      enum: ['DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'CONFIRMED', 'CANCELLED'],
      default: 'DRAFT',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    razorpayOrderId: { type: String, default: '', index: true },
    razorpayPaymentId: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

export const GroupBooking: Model<IGroupBooking> =
  mongoose.models.GroupBooking || mongoose.model<IGroupBooking>('GroupBooking', GroupBookingSchema);

export default GroupBooking;

import mongoose, { Schema, Document, Model } from 'mongoose';
import './User';
import './Vehicle';
import './Vendor';
import './Destination';

export type PickupType =
  | 'VENDOR_PICKUP'
  | 'HOTEL_DELIVERY'
  | 'HOSTEL_DELIVERY'
  | 'STATION_DELIVERY'
  | 'AIRPORT_DELIVERY'
  | 'ONE_WAY_DROP';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PRE_PICKUP'
  | 'READY_FOR_HANDOVER'
  | 'HANDED_OVER'
  | 'ACTIVE'
  | 'RETURN_PENDING'
  | 'RETURN_INSPECTION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CANCELLED_BY_CUSTOMER'
  | 'CANCELLED_BY_VENDOR'
  | 'CANCELLED_BY_ADMIN'
  | 'DISPUTED';

export type DepositStatus =
  | 'PENDING'
  | 'HELD'
  | 'REFUNDED'
  | 'PARTIALLY_DEDUCTED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  bookingNumber: string;
  groupBookingId?: string;
  customerId: mongoose.Types.ObjectId;
  customerVehicleId?: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  destinationId: mongoose.Types.ObjectId;
  pickupDateTime: Date;
  returnDateTime: Date;
  pickupType: PickupType;
  pickupLocation: string;
  dropoffLocation: string;
  rentalDurationDays: number;
  rentalDurationHours: number;
  // Transparent financial fields
  basePrice: number;
  deliveryCharge: number;
  platformFee: number;
  taxes: number; // GST 18% on platform + delivery + rental base
  securityDeposit: number; // Strictly refundable, NOT platform revenue
  securityDepositEnabled?: boolean;
  securityDepositAmount?: number;
  discountAmount: number;
  totalPayable: number;
  // Statuses
  depositStatus: DepositStatus;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  kycVerified: boolean;
  customerDetails: {
    fullName: string;
    phone: string;
    email: string;
    drivingLicenseNumber: string;
  };
  riderDetails?: {
    fullName: string;
    drivingLicenseNumber: string;
    drivingLicenseDocumentUrl?: string;
    drivingLicenseDocumentKey?: string;
    verificationStatus?: string;
    rejectionReason?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  deliveryLocation?: {
    locationType: 'VENDOR_PICKUP' | 'DOORSTEP' | 'HOTEL' | 'HOSTEL' | 'OTHER';
    locationSource: 'CURRENT_LOCATION' | 'GOOGLE_PLACE' | 'MAP_PIN' | 'MANUAL';
    address: string;
    houseOrRoom?: string;
    buildingName?: string;
    landmark?: string;
    city: string;
    state?: string;
    country?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
    formattedAddress?: string;
    contactName?: string;
    contactPhone?: string;
    deliveryInstructions?: string;
  };
  couponCode?: string;
  handoverPickupId?: mongoose.Types.ObjectId;
  handoverReturnId?: mongoose.Types.ObjectId;
  cancellationReason?: string;
  cancelledBy?: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  cancelledAt?: Date;
  cancellationRefundAmount?: number;
  cancellationFee?: number;
  refundStatus?: 'NONE' | 'PENDING' | 'PROCESSED' | 'FAILED' | 'NOT_APPLICABLE';
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },
    groupBookingId: { type: String, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerVehicleId: { type: Schema.Types.ObjectId, ref: 'CustomerVehicle' },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    destinationId: { type: Schema.Types.ObjectId, ref: 'Destination', required: true },
    pickupDateTime: { type: Date, required: true, index: true },
    returnDateTime: { type: Date, required: true, index: true },
    pickupType: {
      type: String,
      enum: [
        'VENDOR_PICKUP',
        'HOTEL_DELIVERY',
        'HOSTEL_DELIVERY',
        'STATION_DELIVERY',
        'AIRPORT_DELIVERY',
        'ONE_WAY_DROP',
      ],
      default: 'VENDOR_PICKUP',
    },
    pickupLocation: { type: String, required: true },
    dropoffLocation: { type: String, required: true },
    rentalDurationDays: { type: Number, required: true, default: 1 },
    rentalDurationHours: { type: Number, required: true, default: 24 },
    basePrice: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    platformFee: { type: Number, default: 49 },
    taxes: { type: Number, default: 0 },
    securityDeposit: { type: Number, required: true },
    securityDepositEnabled: { type: Boolean, default: true },
    securityDepositAmount: { type: Number, default: 1000 },
    discountAmount: { type: Number, default: 0 },
    totalPayable: { type: Number, required: true },
    depositStatus: {
      type: String,
      enum: ['PENDING', 'HELD', 'REFUNDED', 'PARTIALLY_DEDUCTED'],
      default: 'PENDING',
      index: true,
    },
    bookingStatus: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PRE_PICKUP',
        'READY_FOR_HANDOVER',
        'HANDED_OVER',
        'ACTIVE',
        'RETURN_PENDING',
        'RETURN_INSPECTION',
        'COMPLETED',
        'CANCELLED',
        'CANCELLED_BY_CUSTOMER',
        'CANCELLED_BY_VENDOR',
        'CANCELLED_BY_ADMIN',
        'DISPUTED',
      ],
      default: 'PENDING',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    kycVerified: { type: Boolean, default: false },
    customerDetails: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      drivingLicenseNumber: { type: String, required: true },
    },
    riderDetails: {
      fullName: { type: String, default: '' },
      drivingLicenseNumber: { type: String, default: '' },
      drivingLicenseDocumentUrl: { type: String, default: '' },
      drivingLicenseDocumentKey: { type: String, default: '' },
      verificationStatus: { type: String, default: 'NOT_STARTED' },
      rejectionReason: { type: String, default: '' },
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relation: { type: String, default: '' },
    },
    deliveryLocation: {
      locationType: {
        type: String,
        enum: ['VENDOR_PICKUP', 'DOORSTEP', 'HOTEL', 'HOSTEL', 'OTHER'],
        default: 'VENDOR_PICKUP',
      },
      locationSource: {
        type: String,
        enum: ['CURRENT_LOCATION', 'GOOGLE_PLACE', 'MAP_PIN', 'MANUAL'],
        default: 'MANUAL',
      },
      address: { type: String, default: '' },
      houseOrRoom: { type: String, default: '' },
      buildingName: { type: String, default: '' },
      landmark: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: 'Uttarakhand' },
      country: { type: String, default: 'India' },
      pincode: { type: String, default: '' },
      latitude: { type: Number },
      longitude: { type: Number },
      placeId: { type: String, default: '' },
      formattedAddress: { type: String, default: '' },
      contactName: { type: String, default: '' },
      contactPhone: { type: String, default: '' },
      deliveryInstructions: { type: String, default: '' },
    },
    couponCode: { type: String, default: '' },
    handoverPickupId: { type: Schema.Types.ObjectId, ref: 'DigitalHandoverReport' },
    handoverReturnId: { type: Schema.Types.ObjectId, ref: 'DigitalHandoverReport' },
    cancellationReason: { type: String, default: '' },
    cancelledBy: { type: String, enum: ['CUSTOMER', 'VENDOR', 'ADMIN'] },
    cancelledAt: { type: Date },
    cancellationRefundAmount: { type: Number, default: 0 },
    cancellationFee: { type: Number, default: 0 },
    refundStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'PROCESSED', 'FAILED', 'NOT_APPLICABLE'],
      default: 'NONE',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for high performance availability lookups and double booking checks
BookingSchema.index({
  vehicleId: 1,
  pickupDateTime: 1,
  returnDateTime: 1,
  bookingStatus: 1,
});
BookingSchema.index({ customerId: 1, createdAt: -1 });
BookingSchema.index({ vendorId: 1, bookingStatus: 1 });

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;

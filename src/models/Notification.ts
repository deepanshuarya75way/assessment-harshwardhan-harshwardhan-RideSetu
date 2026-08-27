import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
  | 'ACCOUNT_VERIFIED'
  | 'KYC_SUBMITTED'
  | 'KYC_APPROVED'
  | 'KYC_VERIFIED'
  | 'KYC_REJECTED'
  | 'VENDOR_SUBMITTED'
  | 'VENDOR_APPROVED'
  | 'VENDOR_REJECTED'
  | 'VENDOR_ACTION_REQUIRED'
  | 'VEHICLE_SUBMITTED'
  | 'VEHICLE_APPROVED'
  | 'VEHICLE_REJECTED'
  | 'BOOKING_CREATED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'VENDOR_ACCEPTED'
  | 'VEHICLE_PREPARING'
  | 'VEHICLE_READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERY_ARRIVED'
  | 'DELIVERY_COMPLETED'
  | 'READY_FOR_PICKUP'
  | 'VEHICLE_HANDED_OVER'
  | 'RENTAL_STARTED'
  | 'RENTAL_EXTENDED'
  | 'RENTAL_ENDING_SOON'
  | 'RETURN_PENDING'
  | 'RETURN_COMPLETED'
  | 'REFUND_INITIATED'
  | 'REFUND_COMPLETED'
  | 'RIDE_STARTING_SOON'
  | 'RIDE_ACTIVE'
  | 'RIDE_COMPLETED'
  | 'REVIEW_REQUEST'
  | 'NEW_REVIEW'
  | 'VENDOR_RESPONSE'
  | 'PAYOUT_ELIGIBLE'
  | 'PAYOUT_PROCESSING'
  | 'PAYOUT_PROCESSED'
  | 'PAYOUT_COMPLETED'
  | 'PAYOUT_FAILED'
  | 'PAYOUT_HELD'
  | 'DAMAGE_REPORTED'
  | 'DISPUTE_CREATED'
  | 'DISPUTE_RESOLVED'
  | 'DISPUTE_UPDATE'
  | 'PICKUP_REMINDER'
  | 'RETURN_REMINDER'
  | 'HANDOVER_READY'
  | 'HANDOVER_ACCEPTED'
  | 'DEPOSIT_REFUNDED'
  | 'SECURITY_DEPOSIT_REFUNDED'
  | 'SECURITY_DEPOSIT_HELD'
  | 'EMERGENCY_ALERT'
  | 'SYSTEM_ALERT'
  | 'GENERAL_SYSTEM';

export type RecipientRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  recipientRole?: RecipientRole;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  read: boolean;
  readAt?: Date;
  link?: string;
  relatedBookingId?: mongoose.Types.ObjectId;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientRole: {
      type: String,
      enum: ['CUSTOMER', 'VENDOR', 'ADMIN'],
      default: 'CUSTOMER',
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
      index: true,
    },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    link: { type: String, default: '' },
    relatedBookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
    idempotencyKey: { type: String, index: true, sparse: true, unique: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;

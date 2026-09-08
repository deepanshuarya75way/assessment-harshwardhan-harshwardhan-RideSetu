import mongoose, { Schema, Document, Model } from 'mongoose';

export type TicketCategory =
  | 'BOOKING'
  | 'PAYMENT'
  | 'VEHICLE'
  | 'KYC'
  | 'EMERGENCY_ROADSIDE'
  | 'VENDOR_ISSUE'
  | 'REFUND'
  | 'OTHER';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_EMERGENCY';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface ITicketMessage {
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'SUPPORT';
  message: string;
  attachments?: string[];
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  _id: mongoose.Types.ObjectId;
  ticketId: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userPhone: string;
  userEmail: string;
  bookingId?: mongoose.Types.ObjectId;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  messages: ITicketMessage[];
  locationNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    userEmail: { type: String, required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    category: {
      type: String,
      enum: [
        'BOOKING',
        'PAYMENT',
        'VEHICLE',
        'KYC',
        'EMERGENCY_ROADSIDE',
        'VENDOR_ISSUE',
        'REFUND',
        'OTHER',
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL_EMERGENCY'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    subject: { type: String, required: true },
    messages: [
      {
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        senderName: { type: String, required: true },
        senderRole: { type: String, enum: ['CUSTOMER', 'VENDOR', 'ADMIN', 'SUPPORT'], required: true },
        message: { type: String, required: true },
        attachments: [{ type: String }],
        createdAt: { type: Date, default: Date.now },
      },
    ],
    locationNote: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

export const SupportTicket: Model<ISupportTicket> =
  mongoose.models.SupportTicket ||
  mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);

export default SupportTicket;

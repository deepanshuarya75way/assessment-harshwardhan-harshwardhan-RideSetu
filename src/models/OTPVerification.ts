import mongoose, { Schema, Document, Model } from 'mongoose';

export type OTPChannel = 'EMAIL' | 'PHONE';

export interface IOTPVerification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  channel: OTPChannel;
  target: string; // email or phone number
  codeHash: string; // SHA-256 / bcrypt hash
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OTPVerificationSchema = new Schema<IOTPVerification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channel: { type: String, enum: ['EMAIL', 'PHONE'], required: true },
    target: { type: String, required: true, trim: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: '10m' } },
    attempts: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 3 },
    verifiedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

OTPVerificationSchema.index({ userId: 1, channel: 1, expiresAt: -1 });

export const OTPVerification: Model<IOTPVerification> =
  mongoose.models.OTPVerification || mongoose.model<IOTPVerification>('OTPVerification', OTPVerificationSchema);

export default OTPVerification;

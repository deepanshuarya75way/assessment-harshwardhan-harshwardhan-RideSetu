import mongoose, { Schema, Document, Model } from 'mongoose';

export type OTPMethod = 'EMAIL' | 'SMS';
export type OTPPurpose = 'SIGNUP' | 'VERIFICATION' | 'PASSWORD_RESET';
export type ChallengeStatus = 'PENDING' | 'VERIFIED' | 'CONSUMED' | 'EXPIRED';

export interface IOTPChallenge extends Document {
  _id: mongoose.Types.ObjectId;
  signupChallengeId: string;
  identifier: string;
  method: OTPMethod;
  purpose: OTPPurpose;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  resendLastSentAt: Date;
  resendCount: number;
  isConsumed: boolean;
  verificationStatus: ChallengeStatus;
  createdAt: Date;
  updatedAt: Date;
}

const OTPChallengeSchema = new Schema<IOTPChallenge>(
  {
    signupChallengeId: { type: String, required: true, unique: true, index: true },
    identifier: { type: String, required: true, trim: true, index: true },
    method: { type: String, enum: ['EMAIL', 'SMS'], required: true },
    purpose: { type: String, enum: ['SIGNUP', 'VERIFICATION', 'PASSWORD_RESET'], default: 'SIGNUP', index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0, min: 0 },
    resendLastSentAt: { type: Date, default: Date.now },
    resendCount: { type: Number, default: 1, min: 1 },
    isConsumed: { type: Boolean, default: false, index: true },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'CONSUMED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Expire document automatically 10 minutes after creation via MongoDB TTL index
OTPChallengeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

export const OTPChallenge: Model<IOTPChallenge> =
  mongoose.models.OTPChallenge || mongoose.model<IOTPChallenge>('OTPChallenge', OTPChallengeSchema);

export default OTPChallenge;

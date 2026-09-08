import mongoose from 'mongoose';
import { Payout, IPayout, PayoutStatus } from '@/models/Payout';
import { IBooking } from '@/models/Booking';
import { Vendor, IVendor } from '@/models/Vendor';
import { VendorPayoutProfile } from '@/models/VendorPayoutProfile';
import { Notification } from '@/models/Notification';
import { AuditLog } from '@/models/AuditLog';
import { getPayoutProvider } from './payout-provider.service';
import connectToDatabase from '@/lib/mongodb';

const VALID_TRANSITIONS: Record<PayoutStatus, PayoutStatus[]> = {
  PENDING: ['ELIGIBLE', 'ON_HOLD', 'FAILED'],
  ELIGIBLE: ['PROCESSING', 'ON_HOLD', 'PAID', 'FAILED'],
  ON_HOLD: ['ELIGIBLE', 'FAILED', 'REVERSED'],
  PROCESSING: ['PAID', 'FAILED'],
  PAID: ['REVERSED'],
  FAILED: ['ELIGIBLE', 'REVERSED'],
  REVERSED: [],
};

export class PayoutService {
  /**
   * Pure calculation helper for vendor payout breakdown
   */
  public static calculateVendorPayout(
    booking: { basePrice: number; deliveryCharge: number },
    commissionRate = 15
  ): {
    eligibleGrossAmount: number;
    platformCommissionAmount: number;
    netPayoutAmount: number;
  } {
    const eligibleGrossAmount = (booking.basePrice || 0) + (booking.deliveryCharge || 0);
    const platformCommissionAmount = Math.round((eligibleGrossAmount * commissionRate) / 100);
    const netPayoutAmount = Math.max(0, eligibleGrossAmount - platformCommissionAmount);

    return {
      eligibleGrossAmount,
      platformCommissionAmount,
      netPayoutAmount,
    };
  }

  /**
   * Generates vendor payout record strictly when booking completes.
   * Excludes refundable security deposit from commission and revenue.
   * Idempotent: checks for existing payout by bookingId.
   */
  public static async createPayoutForCompletedBooking(booking: IBooking): Promise<IPayout | null> {
    await connectToDatabase();

    const existingPayout = await Payout.findOne({ bookingId: booking._id });
    if (existingPayout) {
      return existingPayout;
    }

    const vendor = await Vendor.findById(booking.vendorId).lean<IVendor>();
    if (!vendor) return null;

    const payoutProfile = await VendorPayoutProfile.findOne({ vendorId: booking.vendorId }).lean();

    const commissionRate = vendor.commissionRate ?? 15;
    const grossAmount = booking.basePrice + (booking.deliveryCharge || 0);
    const platformCommission = Math.round((grossAmount * commissionRate) / 100);
    const taxes = Math.round(platformCommission * 0.18);
    const netAmount = Math.max(0, grossAmount - platformCommission);

    const idempotencyKey = `payout_trf_${booking._id.toString()}`;

    const payout = await Payout.create({
      vendorId: booking.vendorId,
      bookingId: booking._id,
      grossAmount,
      platformCommission,
      commissionPercentage: commissionRate,
      taxes,
      netAmount,
      status: 'ELIGIBLE',
      idempotencyKey,
      provider: payoutProfile?.provider || 'MOCK',
      bankAccountRef: payoutProfile?.maskedAccountNumber || vendor.bankAccountReference || 'Registered Bank Account',
      notes: `Payout eligible for completed booking ${booking.bookingNumber}`,
    });

    await Notification.create({
      userId: vendor.userId,
      title: 'New Payout Eligible',
      message: `Net payout of ₹${netAmount} is eligible for completed booking ${booking.bookingNumber}.`,
      type: 'PAYOUT_PROCESSED',
      link: '/vendor',
    });

    return payout;
  }

  /**
   * Executes a payout transfer using the active PayoutProvider.
   * Strictly enforces idempotency to prevent duplicate bank transfers.
   */
  public static async executePayout(
    payoutId: string,
    adminUserId?: string
  ): Promise<{ success: boolean; payout: IPayout; message?: string }> {
    await connectToDatabase();

    const payout = await Payout.findById(payoutId);
    if (!payout) {
      throw new Error('Payout record not found.');
    }

    if (payout.status === 'PAID') {
      return { success: true, payout, message: 'Payout is already settled.' };
    }

    if (payout.status === 'ON_HOLD') {
      throw new Error('Cannot execute payout while status is ON_HOLD.');
    }

    const payoutProfile = await VendorPayoutProfile.findOne({ vendorId: payout.vendorId }).lean();
    const provider = getPayoutProvider();

    // Transition to PROCESSING
    payout.status = 'PROCESSING';
    await payout.save();

    const idempotencyKey = payout.idempotencyKey || `payout_trf_${payout.bookingId.toString()}`;

    const result = await provider.createTransfer({
      payoutId: payout._id.toString(),
      vendorId: payout.vendorId.toString(),
      providerAccountId: payoutProfile?.providerAccountId,
      amount: payout.netAmount,
      currency: 'INR',
      idempotencyKey,
      notes: payout.notes,
    });

    payout.status = result.status === 'PAID' ? 'PAID' : 'PROCESSING';
    payout.providerReference = result.providerReference;
    payout.providerTransferId = result.transferId;
    if (result.settledAt) payout.paidAt = result.settledAt;
    payout.settlementDate = result.settledAt || new Date();
    await payout.save();

    // Create Audit Log
    await AuditLog.create({
      action: 'PAYOUT_EXECUTED',
      userId: adminUserId ? new mongoose.Types.ObjectId(adminUserId) : undefined,
      userRole: 'ADMIN',
      resourceType: 'PAYOUT',
      resourceId: payout._id.toString(),
      details: {
        vendorId: payout.vendorId.toString(),
        bookingId: payout.bookingId.toString(),
        netAmount: payout.netAmount,
        provider: payout.provider,
        providerReference: result.providerReference,
        status: payout.status,
      },
    });

    return { success: true, payout, message: result.providerNotes };
  }

  /**
   * Updates payout state machine status with transition guards and audit logging.
   */
  public static async updatePayoutStatus(
    payoutId: string,
    newStatus: PayoutStatus,
    reason?: string,
    adminUserId?: string
  ): Promise<IPayout> {
    await connectToDatabase();

    const payout = await Payout.findById(payoutId);
    if (!payout) {
      throw new Error('Payout record not found.');
    }

    const allowed = VALID_TRANSITIONS[payout.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid payout state transition from ${payout.status} to ${newStatus}. Allowed next states: ${allowed.join(', ') || 'none'}`
      );
    }

    const previousStatus = payout.status;
    payout.status = newStatus;
    if (newStatus === 'ON_HOLD') {
      payout.holdReason = reason || 'Admin compliance hold';
    } else if (newStatus === 'PAID') {
      payout.paidAt = new Date();
    }
    await payout.save();

    // Record Audit Log for every admin arbitration/hold/status update
    await AuditLog.create({
      action: `PAYOUT_STATUS_${newStatus}`,
      userId: adminUserId ? new mongoose.Types.ObjectId(adminUserId) : undefined,
      userRole: 'ADMIN',
      resourceType: 'PAYOUT',
      resourceId: payout._id.toString(),
      details: {
        previousStatus,
        newStatus,
        reason: reason || '',
        vendorId: payout.vendorId.toString(),
        bookingId: payout.bookingId.toString(),
        netAmount: payout.netAmount,
      },
    });

    return payout;
  }
}

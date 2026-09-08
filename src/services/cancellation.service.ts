import { IBooking } from '@/models/Booking';

export interface CancellationPolicyRule {
  minHoursBeforePickup: number;
  maxHoursBeforePickup?: number;
  rentalRefundPercent: number; // 0 to 100
  depositRefundPercent: number; // 0 to 100
  deliveryRefundPercent: number; // 0 to 100
  platformFeeRefundPercent: number; // 0 to 100
  description: string;
}

export interface CancellationRefundCalculation {
  hoursBeforePickup: number;
  rentalRefundPercent: number;
  baseRentalPaid: number;
  rentalRefundAmount: number;
  depositRefundAmount: number;
  deliveryRefundAmount: number;
  platformFeeRefundAmount: number;
  taxesRefundAmount: number;
  totalPaid: number;
  cancellationFee: number;
  totalRefundAmount: number;
  policyDescription: string;
}

export class CancellationService {
  /**
   * Centralized, configurable default cancellation policy windows
   */
  public static readonly DEFAULT_POLICY_RULES: CancellationPolicyRule[] = [
    {
      minHoursBeforePickup: 48,
      rentalRefundPercent: 100,
      depositRefundPercent: 100,
      deliveryRefundPercent: 100,
      platformFeeRefundPercent: 0,
      description: 'More than 48 hours before pickup: 100% rental refund & full deposit refund',
    },
    {
      minHoursBeforePickup: 24,
      maxHoursBeforePickup: 48,
      rentalRefundPercent: 75,
      depositRefundPercent: 100,
      deliveryRefundPercent: 100,
      platformFeeRefundPercent: 0,
      description: '24–48 hours before pickup: 75% rental refund & full deposit refund',
    },
    {
      minHoursBeforePickup: 12,
      maxHoursBeforePickup: 24,
      rentalRefundPercent: 50,
      depositRefundPercent: 100,
      deliveryRefundPercent: 100,
      platformFeeRefundPercent: 0,
      description: '12–24 hours before pickup: 50% rental refund & full deposit refund',
    },
    {
      minHoursBeforePickup: 0,
      maxHoursBeforePickup: 12,
      rentalRefundPercent: 0,
      depositRefundPercent: 100,
      deliveryRefundPercent: 100,
      platformFeeRefundPercent: 0,
      description: 'Less than 12 hours before pickup: 0% rental refund & full deposit refund',
    },
  ];

  /**
   * Calculate exact refund breakdown for customer cancellation
   */
  public static calculateCustomerCancellationRefund(params: {
    booking: IBooking;
    cancellationTime?: Date;
    customRules?: CancellationPolicyRule[];
  }): CancellationRefundCalculation {
    const { booking } = params;
    const now = params.cancellationTime || new Date();
    const pickupTime = new Date(booking.pickupDateTime);

    const diffMs = pickupTime.getTime() - now.getTime();
    const hoursBeforePickup = Math.max(0, diffMs / (1000 * 60 * 60));

    const rules = params.customRules || this.DEFAULT_POLICY_RULES;

    // Find matching rule
    let matchedRule = rules.find((rule) => {
      if (rule.maxHoursBeforePickup !== undefined) {
        return hoursBeforePickup >= rule.minHoursBeforePickup && hoursBeforePickup < rule.maxHoursBeforePickup;
      }
      return hoursBeforePickup >= rule.minHoursBeforePickup;
    });

    if (!matchedRule) {
      matchedRule = rules[rules.length - 1]; // fallback to last rule (<12h)
    }

    const baseRentalPaid = booking.basePrice - (booking.discountAmount || 0);
    const rentalRefundPercent = matchedRule.rentalRefundPercent;

    // Calculate component refunds
    const rentalRefundAmount = Math.round((baseRentalPaid * rentalRefundPercent) / 100);
    const depositRefundAmount = booking.securityDeposit || 0; // Deposit is strictly isolated and 100% refundable on pre-handover cancellation
    const deliveryRefundAmount = Math.round(((booking.deliveryCharge || 0) * matchedRule.deliveryRefundPercent) / 100);
    const platformFeeRefundAmount = 0; // Tech platform fee is non-refundable on customer cancellation
    const taxesRefundAmount = Math.round((rentalRefundAmount * 0.18)); // Pro-rated GST on refunded rental

    const totalPaid = booking.totalPayable;
    const totalRefundAmount = rentalRefundAmount + depositRefundAmount + deliveryRefundAmount;
    const cancellationFee = Math.max(0, totalPaid - totalRefundAmount);

    return {
      hoursBeforePickup: parseFloat(hoursBeforePickup.toFixed(1)),
      rentalRefundPercent,
      baseRentalPaid,
      rentalRefundAmount,
      depositRefundAmount,
      deliveryRefundAmount,
      platformFeeRefundAmount,
      taxesRefundAmount,
      totalPaid,
      cancellationFee,
      totalRefundAmount,
      policyDescription: matchedRule.description,
    };
  }

  /**
   * Vendor Cancellation: Customer receives 100% full refund of all charges and fees
   */
  public static calculateVendorCancellationRefund(booking: IBooking): CancellationRefundCalculation {
    const baseRentalPaid = booking.basePrice - (booking.discountAmount || 0);

    return {
      hoursBeforePickup: 0,
      rentalRefundPercent: 100,
      baseRentalPaid,
      rentalRefundAmount: baseRentalPaid,
      depositRefundAmount: booking.securityDeposit || 0,
      deliveryRefundAmount: booking.deliveryCharge || 0,
      platformFeeRefundAmount: booking.platformFee || 0,
      taxesRefundAmount: booking.taxes || 0,
      totalPaid: booking.totalPayable,
      cancellationFee: 0,
      totalRefundAmount: booking.totalPayable, // 100% Full customer refund
      policyDescription: 'Vendor cancelled booking: 100% complete refund including all fees and deposit',
    };
  }

  /**
   * Admin Exceptional Cancellation: Custom refund amount or 100% full refund
   */
  public static calculateAdminCancellationRefund(booking: IBooking, overrideRefundAmount?: number): CancellationRefundCalculation {
    const totalPaid = booking.totalPayable;
    const totalRefund = overrideRefundAmount !== undefined ? Math.min(totalPaid, Math.max(0, overrideRefundAmount)) : totalPaid;
    const cancellationFee = totalPaid - totalRefund;

    return {
      hoursBeforePickup: 0,
      rentalRefundPercent: Math.round((totalRefund / totalPaid) * 100),
      baseRentalPaid: booking.basePrice,
      rentalRefundAmount: totalRefund > (booking.securityDeposit || 0) ? totalRefund - (booking.securityDeposit || 0) : 0,
      depositRefundAmount: Math.min(totalRefund, booking.securityDeposit || 0),
      deliveryRefundAmount: 0,
      platformFeeRefundAmount: 0,
      taxesRefundAmount: 0,
      totalPaid,
      cancellationFee,
      totalRefundAmount: totalRefund,
      policyDescription: 'Admin exceptional override refund',
    };
  }
}

export default CancellationService;

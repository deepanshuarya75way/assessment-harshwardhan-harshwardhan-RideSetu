import { IVehicle } from '@/models/Vehicle';
import { ICoupon } from '@/models/Coupon';
import { calculateDurationHours, calculateDurationDays } from '@/lib/utils';

export interface PricingCalculationResult {
  pickupDateTime: Date;
  returnDateTime: Date;
  durationHours: number;
  durationDays: number;
  pricePerDay: number;
  basePrice: number;
  deliveryCharge: number;
  platformFee: number;
  taxes: number; // 18% GST on services (platform fee + delivery) + rental base
  securityDeposit: number;
  discountAmount: number;
  totalPayable: number;
  appliedCoupon?: {
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
  };
}

export class PricingService {
  /**
   * Centralized server-side pricing engine for RideSetu bookings.
   * Single source of truth across customer checkout, booking creation, and vendor summaries.
   */
  public static calculatePricing(params: {
    vehicle: Partial<IVehicle>;
    pickupDateTime: Date | string;
    returnDateTime: Date | string;
    pickupType?: string;
    deliveryFee?: number;
    coupon?: Partial<ICoupon> | null;
    city?: string;
  }): PricingCalculationResult {
    const pickup = new Date(params.pickupDateTime);
    const returnDate = new Date(params.returnDateTime);

    const durationHours = calculateDurationHours(pickup, returnDate);
    const durationDays = calculateDurationDays(pickup, returnDate);

    const pricePerDay = params.vehicle.pricePerDay || 500;
    const basePrice = pricePerDay * durationDays;

    // Delivery fee calculation
    let deliveryCharge = 0;
    if (params.pickupType && params.pickupType !== 'VENDOR_PICKUP') {
      deliveryCharge = params.deliveryFee ?? (params.pickupType === 'AIRPORT_DELIVERY' ? 250 : 120);
    }

    // Platform convenience fee (Standard Indian marketplace tech fee)
    const platformFee = 49;

    // Security deposit (strictly refundable, not platform revenue)
    let securityDeposit = 0;
    if (params.vehicle.securityDepositEnabled !== false) {
      securityDeposit = params.vehicle.securityDepositAmount ?? params.vehicle.securityDeposit ?? 1000;
    }

    // Coupon discount calculation
    let discountAmount = 0;
    let appliedCoupon: PricingCalculationResult['appliedCoupon'] | undefined = undefined;

    if (params.coupon && (params.coupon.isActive === undefined || params.coupon.isActive === true)) {
      const now = new Date();
      const isExpired = params.coupon.expiryDate ? new Date(params.coupon.expiryDate) < now : false;
      const meetsMinBooking = basePrice >= (params.coupon.minimumBookingValue || 0);

      // Check category match if configured
      const vehicleCategory = params.vehicle.category;
      const matchesCategory =
        !params.coupon.applicableVehicleCategories ||
        params.coupon.applicableVehicleCategories.length === 0 ||
        (vehicleCategory && params.coupon.applicableVehicleCategories.includes(vehicleCategory));

      if (!isExpired && meetsMinBooking && matchesCategory) {
        if (params.coupon.discountType === 'PERCENTAGE') {
          const rawDiscount = (basePrice * (params.coupon.discountValue || 0)) / 100;
          discountAmount = Math.min(rawDiscount, params.coupon.maximumDiscount || 500);
        } else {
          discountAmount = Math.min(params.coupon.discountValue || 0, basePrice);
        }
        discountAmount = Math.round(discountAmount);

        appliedCoupon = {
          code: params.coupon.code || '',
          discountType: params.coupon.discountType || 'PERCENTAGE',
          discountValue: params.coupon.discountValue || 0,
          discountAmount,
        };
      }
    }

    // GST: 18% on (base rental + delivery + platform fee - discount)
    const taxableAmount = Math.max(0, basePrice + deliveryCharge + platformFee - discountAmount);
    const taxes = Math.round(taxableAmount * 0.18);

    // Total payable by customer (includes refundable security deposit)
    const totalPayable = taxableAmount + taxes + securityDeposit;

    return {
      pickupDateTime: pickup,
      returnDateTime: returnDate,
      durationHours,
      durationDays,
      pricePerDay,
      basePrice,
      deliveryCharge,
      platformFee,
      taxes,
      securityDeposit,
      discountAmount,
      totalPayable,
      appliedCoupon,
    };
  }
}

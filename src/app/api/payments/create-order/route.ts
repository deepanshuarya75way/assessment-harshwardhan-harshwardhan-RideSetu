import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { Payment } from '@/models/Payment';
import { Vehicle } from '@/models/Vehicle';
import { Coupon } from '@/models/Coupon';
import { Booking } from '@/models/Booking';
import { PaymentService } from '@/services/payment.service';
import { AvailabilityService } from '@/services/availability.service';
import { PricingService } from '@/services/pricing.service';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request as any);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to initiate checkout.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      vehicleId,
      pickupDateTime,
      returnDateTime,
      pickupType,
      couponCode,
      idempotencyKey,
    } = body;

    if (!vehicleId || !pickupDateTime || !returnDateTime) {
      return NextResponse.json(
        { success: false, error: 'Missing mandatory reservation parameters (vehicleId, pickupDateTime, returnDateTime).' },
        { status: 400 }
      );
    }

    const pickup = new Date(pickupDateTime);
    const returnDate = new Date(returnDateTime);

    if (isNaN(pickup.getTime()) || isNaN(returnDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date/time format provided.' },
        { status: 400 }
      );
    }

    if (returnDate <= pickup) {
      return NextResponse.json(
        { success: false, error: 'Return date & time must be after pickup date & time.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Canonical Vehicle & Vendor Serviceability Validation
    const serviceability = await AvailabilityService.validateVehicleServiceability({
      vehicleId,
      pickupDateTime,
      returnDateTime,
      excludeUserId: user.userId,
    });

    if (!serviceability.serviceable || !serviceability.available) {
      const statusMap: Record<string, number> = {
        VEHICLE_NOT_FOUND: 404,
        OVERLAPPING_BOOKING: 409,
        ACTIVE_RESERVATION_LOCK: 409,
      };
      const statusCode = statusMap[serviceability.code] || 400;

      return NextResponse.json(
        {
          success: false,
          code: serviceability.code,
          error: serviceability.reason || 'This vehicle is currently unavailable for booking.',
        },
        { status: statusCode }
      );
    }

    const vehicle = serviceability.vehicle!;

    // 2. Server-Side Pricing Recalculation (NEVER TRUST FRONTEND AMOUNT)
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase(), isActive: true }).lean();
    }

    const pricing = PricingService.calculatePricing({
      vehicle: vehicle as any,
      pickupDateTime,
      returnDateTime,
      pickupType: pickupType || 'VENDOR_PICKUP',
      coupon: coupon as any,
    });

    // 4. Idempotency & Stale Order Invalidation Check
    const activeKey = idempotencyKey || `idem_${user.userId}_${vehicleId}_${pickup.getTime()}_${returnDate.getTime()}`;
    const existingPayment = await Payment.findOne({
      idempotencyKey: activeKey,
      status: { $in: ['CREATED', 'PENDING', 'CAPTURED', 'SUCCESS'] },
    }).lean();

    if (existingPayment) {
      // If already captured, return the confirmed booking
      if (existingPayment.status === 'CAPTURED' || (existingPayment.status as string) === 'SUCCESS') {
        const existingBooking = existingPayment.bookingId
          ? await Booking.findById(existingPayment.bookingId).lean()
          : null;
        return NextResponse.json({
          success: true,
          isAlreadyCaptured: true,
          booking: existingBooking,
          order: {
            orderId: existingPayment.providerOrderId,
            amount: Math.round(existingPayment.amount * 100),
            currency: existingPayment.currency,
            keyId: PaymentService.getKeyId(),
            pricing: existingPayment.breakdown,
            isSandbox: true,
          },
        });
      }

      // If existing payment is uncaptured and exact amount matches current calculation, safely reuse
      if (existingPayment.amount === pricing.totalPayable) {
        return NextResponse.json({
          success: true,
          order: {
            orderId: existingPayment.providerOrderId,
            amount: Math.round(existingPayment.amount * 100),
            currency: existingPayment.currency,
            keyId: PaymentService.getKeyId(),
            pricing: existingPayment.breakdown,
            isSandbox: true,
            isIdempotentReuse: true,
          },
        });
      }

      // If amounts differ (pricing/coupon changed), invalidate the old uncaptured order
      await Payment.findByIdAndUpdate(existingPayment._id, {
        status: 'FAILED',
        errorDescription: 'Invalidated due to checkout trip/price modification',
      });
    }

    // 5. Acquire or Synchronize Distributed Reservation Lock for Current User
    let reservationLockId: string | undefined;
    const lockResult = await AvailabilityService.acquireDistributedReservation({
      vehicleId,
      userId: user.userId,
      pickupDateTime,
      returnDateTime,
      durationMinutes: 15,
    });

    if (lockResult.acquired && lockResult.reservation) {
      reservationLockId = lockResult.reservation._id.toString();
    } else {
      return NextResponse.json(
        { success: false, error: lockResult.reason || 'This vehicle is temporarily reserved for another customer for the selected dates.' },
        { status: 409 }
      );
    }

    // 6. Create Razorpay Test/Sandbox Order with Server-Calculated Amount
    const order = await PaymentService.createOrder({
      amount: pricing.totalPayable,
      currency: 'INR',
      receipt: `rcpt_${user.userId.slice(-6)}_${Date.now()}`,
      notes: {
        vehicleId,
        customerId: user.userId,
        pickupDateTime: pickup.toISOString(),
        returnDateTime: returnDate.toISOString(),
        durationDays: pricing.durationDays.toString(),
        durationHours: pricing.durationHours.toString(),
        securityDeposit: pricing.securityDeposit.toString(),
        totalPayable: pricing.totalPayable.toString(),
        reservationLockId: reservationLockId || '',
      },
    });

    // 7. Store Immutable Payment Audit Record
    await Payment.create({
      bookingId: undefined,
      customerId: new mongoose.Types.ObjectId(user.userId),
      vendorId: (vehicle as any).vendorId?._id || (vehicle as any).vendorId,
      amount: pricing.totalPayable,
      currency: 'INR',
      status: 'CREATED',
      provider: 'RAZORPAY',
      providerOrderId: order.id,
      idempotencyKey: activeKey,
      breakdown: {
        basePrice: pricing.basePrice,
        deliveryFee: pricing.deliveryCharge,
        platformFee: pricing.platformFee,
        tax: pricing.taxes,
        securityDeposit: pricing.securityDeposit,
        discountAmount: pricing.discountAmount,
        totalPayable: pricing.totalPayable,
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.id,
        amount: order.amount, // in paise
        currency: order.currency,
        keyId: PaymentService.getKeyId(),
        pricing,
        isSandbox: true,
      },
    });
  } catch (error: any) {
    console.error('[API Create Order Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment order initiation failed.' },
      { status: 500 }
    );
  }
}

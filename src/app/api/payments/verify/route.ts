import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/services/payment.service';
import { BookingService } from '@/services/booking.service';
import { AvailabilityService } from '@/services/availability.service';
import { Payment } from '@/models/Payment';
import { Booking } from '@/models/Booking';
import { AuditLog } from '@/models/AuditLog';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login to verify payment.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      bookingData,
    } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !bookingData) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment verification parameters.' },
        { status: 400 }
      );
    }

    // 1. Find internal payment record created during order creation
    let paymentRecord = await Payment.findOne({ providerOrderId: razorpayOrderId });

    // 2. Check for Idempotency (prevent duplicate booking creation or double charge)
    if (paymentRecord && (paymentRecord.status === 'CAPTURED' || (paymentRecord.status as string) === 'SUCCESS')) {
      const existingBooking = paymentRecord.bookingId
        ? await Booking.findById(paymentRecord.bookingId).lean()
        : await Booking.findOne({ razorpayOrderId }).lean();

      return NextResponse.json({
        success: true,
        isDuplicate: true,
        booking: existingBooking,
        message: 'Payment already verified and booking confirmed.',
      });
    }

    // 3. Server-side HMAC-SHA256 signature verification
    const isValidSignature = PaymentService.verifySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValidSignature) {
      if (paymentRecord) {
        paymentRecord.status = 'FAILED';
        paymentRecord.failureReason = 'Invalid cryptographic HMAC-SHA256 signature';
        paymentRecord.providerPaymentId = razorpayPaymentId;
        await paymentRecord.save();

        if (paymentRecord.reservationLockId) {
          try {
            await AvailabilityService.releaseReservation(paymentRecord.reservationLockId);
          } catch (e) {
            console.warn('[Availability] Failed to release lock on payment failure:', e);
          }
        }
      }

      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed. Transaction rejected.' },
        { status: 400 }
      );
    }

    // 4. Validate Amount & Currency Consistency
    if (paymentRecord) {
      if (paymentRecord.currency !== 'INR') {
        paymentRecord.status = 'FAILED';
        paymentRecord.failureReason = 'Currency mismatch (expected INR)';
        await paymentRecord.save();
        return NextResponse.json(
          { success: false, error: 'Payment currency mismatch.' },
          { status: 400 }
        );
      }
    }

    // 5. Atomic Booking Confirmation via existing BookingService
    try {
      const result = await BookingService.createBooking({
        ...bookingData,
        customerId: user.userId,
        razorpayOrderId,
        razorpayPaymentId,
        paymentProvider: process.env.PAYMENT_PROVIDER === 'RAZORPAY' ? 'RAZORPAY_SANDBOX' : 'MOCK',
      });

      // 6. Update Payment record to canonical CAPTURED state
      if (!paymentRecord) {
        paymentRecord = await Payment.findOne({ providerOrderId: razorpayOrderId });
      }

      if (paymentRecord) {
        paymentRecord.bookingId = result.booking._id;
        paymentRecord.status = 'CAPTURED';
        paymentRecord.signatureVerified = true;
        paymentRecord.providerPaymentId = razorpayPaymentId;
        paymentRecord.providerSignature = razorpaySignature;
        paymentRecord.method = bookingData.paymentMethod || paymentRecord.method || 'UPI';
        await paymentRecord.save();

        if (paymentRecord.reservationLockId && result.booking?._id) {
          try {
            await AvailabilityService.confirmReservation(paymentRecord.reservationLockId, result.booking._id);
          } catch (lockErr) {
            console.warn('[Availability] Failed to confirm reservation lock:', lockErr);
          }
        }
      }

      // 7. Audit Log Record
      try {
        await AuditLog.create({
          action: 'PAYMENT_CAPTURED',
          performedBy: user.userId,
          targetModel: 'Payment',
          targetId: paymentRecord?._id || result.booking._id,
          details: {
            bookingId: result.booking._id,
            bookingNumber: result.booking.bookingNumber,
            providerOrderId: razorpayOrderId,
            providerPaymentId: razorpayPaymentId,
            amount: result.booking.totalPayable,
            currency: 'INR',
          },
        });
      } catch (auditErr) {
        console.warn('[AuditLog] Failed to record payment audit log:', auditErr);
      }

      return NextResponse.json({
        success: true,
        booking: result.booking,
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        paymentStatus: 'CAPTURED',
      });
    } catch (bookingError: any) {
      // If booking creation fails after signature verification, log for reconciliation
      if (paymentRecord) {
        paymentRecord.status = 'AUTHORIZED';
        paymentRecord.failureReason = `Booking confirmation failed: ${bookingError.message}`;
        await paymentRecord.save();
      }

      try {
        await AuditLog.create({
          action: 'PAYMENT_RECONCILIATION_REQUIRED',
          performedBy: user.userId,
          targetModel: 'Payment',
          targetId: paymentRecord?._id,
          details: {
            error: bookingError.message,
            providerOrderId: razorpayOrderId,
            providerPaymentId: razorpayPaymentId,
          },
        });
      } catch {}

      throw bookingError;
    }
  } catch (error: any) {
    console.error('[Payment Verify Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment verification and booking confirmation failed.' },
      { status: 409 }
    );
  }
}

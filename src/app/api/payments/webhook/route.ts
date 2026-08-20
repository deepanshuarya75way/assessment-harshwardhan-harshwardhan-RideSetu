import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/services/payment.service';
import { Payment } from '@/models/Payment';
import { AuditLog } from '@/models/AuditLog';
import { AvailabilityService } from '@/services/availability.service';
import connectToDatabase from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Read the RAW body string BEFORE parsing JSON
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      );
    }

    // 2. Cryptographic signature verification of raw body
    const isValid = PaymentService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const event = payload.event;
    const eventId = payload.event_id || `evt_${Date.now()}`;
    const entity = payload.payload?.payment?.entity || payload.payload?.refund?.entity || {};

    await connectToDatabase();

    // 3. Process Events Idempotently
    if (event === 'payment.captured') {
      const orderId = entity.order_id;
      const paymentId = entity.id;

      if (orderId) {
        const paymentRecord = await Payment.findOne({ providerOrderId: orderId });
        if (paymentRecord && paymentRecord.status !== 'CAPTURED') {
          paymentRecord.status = 'CAPTURED';
          paymentRecord.providerPaymentId = paymentId;
          paymentRecord.signatureVerified = true;
          await paymentRecord.save();

          await AuditLog.create({
            action: 'WEBHOOK_PAYMENT_CAPTURED',
            performedBy: 'SYSTEM_WEBHOOK',
            targetModel: 'Payment',
            targetId: paymentRecord._id,
            details: { eventId, orderId, paymentId, event },
          });
        }
      }
    } else if (event === 'payment.failed') {
      const orderId = entity.order_id;
      if (orderId) {
        const paymentRecord = await Payment.findOne({ providerOrderId: orderId });
        if (paymentRecord && paymentRecord.status !== 'CAPTURED') {
          paymentRecord.status = 'FAILED';
          paymentRecord.failureReason = entity.error_description || 'Payment failed (reported by webhook)';
          await paymentRecord.save();

          if (paymentRecord.reservationLockId) {
            try {
              await AvailabilityService.releaseReservation(paymentRecord.reservationLockId);
            } catch (err) {
              console.warn('[Webhook] Failed to release lock on payment failure:', err);
            }
          }

          await AuditLog.create({
            action: 'WEBHOOK_PAYMENT_FAILED',
            performedBy: 'SYSTEM_WEBHOOK',
            targetModel: 'Payment',
            targetId: paymentRecord._id,
            details: { eventId, orderId, error: entity.error_description },
          });
        }
      }
    } else if (event === 'refund.processed' || event === 'refund.created') {
      const paymentId = entity.payment_id;
      if (paymentId) {
        const paymentRecord = await Payment.findOne({ providerPaymentId: paymentId });
        if (paymentRecord) {
          const refundAmount = (entity.amount || 0) / 100;
          paymentRecord.status = 'REFUNDED';
          paymentRecord.refundStatus = 'PROCESSED';
          paymentRecord.refundedAmount = refundAmount;
          await paymentRecord.save();

          await AuditLog.create({
            action: 'WEBHOOK_REFUND_PROCESSED',
            performedBy: 'SYSTEM_WEBHOOK',
            targetModel: 'Payment',
            targetId: paymentRecord._id,
            details: { eventId, paymentId, refundAmount },
          });
        }
      }
    }

    return NextResponse.json({
      status: 'ok',
      received: true,
      event,
    });
  } catch (error: any) {
    console.error('[Payment Webhook Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

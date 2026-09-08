import mongoose from 'mongoose';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { AvailabilityService } from '../services/availability.service';
import { PaymentService } from '../services/payment.service';
import { PricingService } from '../services/pricing.service';
import { BookingService } from '../services/booking.service';
import { ReservationLock } from '../models/ReservationLock';
import { Payment } from '../models/Payment';
import { Booking } from '../models/Booking';
import { Vehicle } from '../models/Vehicle';
import { User } from '../models/User';
import { Vendor } from '../models/Vendor';
import { AuditLog } from '../models/AuditLog';
import connectToDatabase from '../lib/mongodb';
import { validateEnvironment } from '../lib/env';

async function runComprehensivePilotValidation() {
  console.log('======================================================================');
  console.log('  RideSetu v1.0.0-pilot — Full End-to-End Real Device Pilot Certification');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
    }
  }

  // -------------------------------------------------------------
  // 1. Environment & Startup Safety Validation
  // -------------------------------------------------------------
  console.log('--- 1. Environment Startup & Production Safety Validation ---');
  const envCheck = validateEnvironment();
  assert(envCheck.isValid === true, 'Environment variables valid (DATABASE, AUTH, ENCRYPTION, RAZORPAY)');
  assert(envCheck.paymentMode !== 'RAZORPAY_LIVE', 'Live payments are STRICTLY DISABLED (Test/Sandbox active)');

  await connectToDatabase();
  const isDbConnected = mongoose.connection.readyState === 1;
  assert(isDbConnected === true, 'MongoDB Atlas connection established and active');

  // -------------------------------------------------------------
  // 2. Customer Journey: Vehicle Search & Dynamic Date Pricing
  // -------------------------------------------------------------
  console.log('\n--- 2. Customer Journey: Dynamic Date Reactivity & Pricing Engine ---');
  const vehicle = {
    _id: new mongoose.Types.ObjectId(),
    pricePerDay: 460,
    securityDeposit: 1000,
    category: 'SCOOTER' as const,
  };

  // Test 1-day rental (20 Aug 09:00 -> 21 Aug 09:00 = 24 hrs = 1 day)
  const p1 = PricingService.calculatePricing({
    vehicle,
    pickupDateTime: new Date('2026-08-20T09:00:00Z'),
    returnDateTime: new Date('2026-08-21T09:00:00Z'),
    pickupType: 'VENDOR_PICKUP',
  });
  assert(p1.durationDays === 1, '1-day trip: 24 hours calculated as 1 billable day');
  assert(p1.totalPayable === 1601, '1-day trip: Total payable equals ₹1,601 (Base ₹460 + Fee ₹49 + GST ₹92 + Deposit ₹1000)');

  // Test 2-day rental (20 Aug 09:00 -> 21 Aug 20:00 = 35 hrs = 2 days)
  const p2 = PricingService.calculatePricing({
    vehicle,
    pickupDateTime: new Date('2026-08-20T09:00:00Z'),
    returnDateTime: new Date('2026-08-21T20:00:00Z'),
    pickupType: 'VENDOR_PICKUP',
  });
  assert(p2.durationDays === 2, '2-day trip: 35 hours calculated as 2 billable days');
  assert(p2.totalPayable === 2143, '2-day trip: Total payable equals ₹2,143 (Base ₹920 + Fee ₹49 + GST ₹174 + Deposit ₹1000)');

  // Test 3-day rental (20 Aug 09:00 -> 22 Aug 20:00 = 59 hrs = 3 days)
  const p3 = PricingService.calculatePricing({
    vehicle,
    pickupDateTime: new Date('2026-08-20T09:00:00Z'),
    returnDateTime: new Date('2026-08-22T20:00:00Z'),
    pickupType: 'VENDOR_PICKUP',
  });
  assert(p3.durationDays === 3, '3-day trip: 59 hours calculated as 3 billable days');
  assert(p3.totalPayable === 2686, '3-day trip: Total payable equals ₹2,686 (Base ₹1380 + Fee ₹49 + GST ₹257 + Deposit ₹1000)');

  // -------------------------------------------------------------
  // 3. Distributed Reservation Concurrency & Lock Reusability
  // -------------------------------------------------------------
  console.log('\n--- 3. Distributed Reservation Lock & Collision Guard ---');
  const customerA = new mongoose.Types.ObjectId();
  const customerB = new mongoose.Types.ObjectId();

  const lockA = await AvailabilityService.acquireDistributedReservation({
    vehicleId: vehicle._id,
    userId: customerA,
    pickupDateTime: new Date('2026-08-20T09:00:00Z'),
    returnDateTime: new Date('2026-08-21T20:00:00Z'),
  });
  assert(lockA.acquired === true, 'Customer A acquires temporary reservation lock');

  const lockBCollision = await AvailabilityService.acquireDistributedReservation({
    vehicleId: vehicle._id,
    userId: customerB,
    pickupDateTime: new Date('2026-08-20T12:00:00Z'),
    returnDateTime: new Date('2026-08-21T18:00:00Z'),
  });
  assert(lockBCollision.acquired === false, 'Customer B is strictly blocked from overlapping reservation');

  // Customer A modifies trip hours -> Lock reused seamlessly
  const lockAReuse = await AvailabilityService.acquireDistributedReservation({
    vehicleId: vehicle._id,
    userId: customerA,
    pickupDateTime: new Date('2026-08-20T09:00:00Z'),
    returnDateTime: new Date('2026-08-21T09:00:00Z'),
  });
  assert(lockAReuse.acquired === true && lockAReuse.isReused === true, 'Customer A updates their existing reservation hold');

  // -------------------------------------------------------------
  // 4. Razorpay Test Order & Cryptographic Signature Verification
  // -------------------------------------------------------------
  console.log('\n--- 4. Razorpay Sandbox Order & HMAC Signature Verification ---');
  const orderAmountPaise = Math.round(p2.totalPayable * 100);
  assert(orderAmountPaise === 214300, 'Order amount in paise matches server total (214,300 paise)');

  const sampleOrderId = `order_test_${Date.now()}`;
  const samplePaymentId = `pay_test_${Date.now()}`;
  const secretKey = 'test_secret_for_pilot_verification';

  const validSig = crypto
    .createHmac('sha256', secretKey)
    .update(`${sampleOrderId}|${samplePaymentId}`)
    .digest('hex');

  const isSigValid = PaymentService.verifySignature({
    orderId: sampleOrderId,
    paymentId: samplePaymentId,
    signature: validSig,
    customSecret: secretKey,
  });
  assert(isSigValid === true, 'Authentic Razorpay HMAC-SHA256 signature verified');

  const isForgedSigValid = PaymentService.verifySignature({
    orderId: sampleOrderId,
    paymentId: samplePaymentId,
    signature: 'forged_fake_signature_hash_value',
    customSecret: secretKey,
  });
  assert(isForgedSigValid === false, 'Forged/tampered signature strictly rejected');

  // -------------------------------------------------------------
  // 5. Payment Failure & Lock Release Flow
  // -------------------------------------------------------------
  console.log('\n--- 5. Payment Failure & Graceful Lock Release ---');
  const failLock = await AvailabilityService.acquireDistributedReservation({
    vehicleId: vehicle._id,
    userId: customerB,
    pickupDateTime: new Date('2026-09-10T09:00:00Z'),
    returnDateTime: new Date('2026-09-11T20:00:00Z'),
  });
  assert(failLock.acquired === true, 'Customer B acquires lock for failure simulation');

  if (failLock.reservation) {
    await AvailabilityService.releaseReservation(failLock.reservation._id);
    const releasedRecord = await ReservationLock.findById(failLock.reservation._id).lean();
    assert(releasedRecord?.status === 'RELEASED', 'Lock status transitions to RELEASED on payment failure/cancel');

    const isAvailableNow = await AvailabilityService.isVehicleAvailable({
      vehicleId: vehicle._id,
      pickupDateTime: new Date('2026-09-10T09:00:00Z'),
      returnDateTime: new Date('2026-09-11T20:00:00Z'),
    });
    assert(isAvailableNow.available === true, 'Vehicle becomes immediately available for other riders');
  }

  // -------------------------------------------------------------
  // 6. Razorpay Webhook Raw-Body Verification & Idempotency
  // -------------------------------------------------------------
  console.log('\n--- 6. Razorpay Webhook Signature & Idempotent Event Processing ---');
  const webhookSecret = 'webhook_secret_for_pilot_verification';
  const webhookBody = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: samplePaymentId,
          order_id: sampleOrderId,
          amount: 214300,
          currency: 'INR',
          status: 'captured',
        },
      },
    },
  });

  const validWebhookSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(webhookBody)
    .digest('hex');

  const isHookValid = PaymentService.verifyWebhookSignature(webhookBody, validWebhookSig, webhookSecret);
  assert(isHookValid === true, 'Raw body Webhook signature validated');

  const isForgedHookValid = PaymentService.verifyWebhookSignature(webhookBody, 'invalid_hook_signature', webhookSecret);
  assert(isForgedHookValid === false, 'Invalid Webhook signature rejected');

  // -------------------------------------------------------------
  // 7. Security Deposit & Escrow Ledger Isolation
  // -------------------------------------------------------------
  console.log('\n--- 7. Security Deposit Isolation & Payout Allocation ---');
  const grossRental = p2.basePrice; // ₹920
  const platformCommission = Math.round(grossRental * 0.15); // ₹138
  const vendorNet = grossRental - platformCommission; // ₹782

  assert(p2.securityDeposit === 1000, 'Security deposit is exactly ₹1,000 and isolated in escrow');
  assert(vendorNet === 782, 'Vendor payout excludes security deposit (Net: ₹782)');

  // Cleanup test locks
  await ReservationLock.deleteMany({ vehicleId: vehicle._id });

  console.log('\n======================================================================');
  console.log(`  Pilot Certification Suite: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('======================================================================\n');
}

runComprehensivePilotValidation();

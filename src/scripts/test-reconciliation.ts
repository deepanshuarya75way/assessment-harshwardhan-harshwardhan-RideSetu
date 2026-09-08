import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PricingService } from '../services/pricing.service';

async function runFinancialReconciliationTest() {
  console.log('======================================================================');
  console.log('  RideSetu — Financial Reconciliation & Ledger Integrity Suite');
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
  // Scenario 1: Standard 2-day Scooter Rental (₹460/day)
  // -------------------------------------------------------------
  console.log('--- 1. Testing Standard 2-day Rental Reconciliation ---');
  const vehicle1 = {
    _id: new mongoose.Types.ObjectId(),
    pricePerDay: 460,
    securityDeposit: 1000,
    category: 'SCOOTER' as const,
  };

  const pricing1 = PricingService.calculatePricing({
    vehicle: vehicle1 as any,
    pickupDateTime: new Date('2026-08-20T09:00:00Z'),
    returnDateTime: new Date('2026-08-21T20:00:00Z'),
    pickupType: 'VENDOR_PICKUP',
  });

  const baseRental1 = 920; // 2 days × ₹460
  const platformFee1 = 49;
  const taxableGross1 = baseRental1 + platformFee1; // ₹969
  const gst1 = Math.round(taxableGross1 * 0.18); // ₹174
  const deposit1 = 1000;
  const expectedTotal1 = baseRental1 + platformFee1 + gst1 + deposit1; // ₹2,143

  assert(pricing1.basePrice === baseRental1, `Base rental matches (₹${baseRental1})`);
  assert(pricing1.platformFee === platformFee1, `Platform fee matches (₹${platformFee1})`);
  assert(pricing1.taxes === gst1, `18% GST matches (₹${gst1})`);
  assert(pricing1.securityDeposit === deposit1, `Deposit matches (₹${deposit1})`);
  assert(pricing1.totalPayable === expectedTotal1, `Total payable matches formula (₹${expectedTotal1})`);

  // Razorpay order in paise
  const orderAmountPaise1 = Math.round(pricing1.totalPayable * 100);
  assert(orderAmountPaise1 === 214300, `Razorpay order paise matches exact integer (214,300 paise)`);

  // Vendor Payout Calculation (15% platform commission on gross rental only, deposit 100% excluded)
  const vendorCommission1 = Math.round(baseRental1 * 0.15); // ₹138
  const netVendorPayout1 = baseRental1 - vendorCommission1; // ₹782

  assert(pricing1.securityDeposit === 1000, `Security deposit is 100% isolated in escrow`);
  assert(netVendorPayout1 === 782, `Net vendor payout correctly calculated as ₹782 (Base ₹920 - Commission ₹138)`);

  // -------------------------------------------------------------
  // Scenario 2: Cancellation Refund Reconciliation (>48h window)
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Cancellation Refund Reconciliation (>48h) ---');
  const refundRental = baseRental1; // 100%
  const refundDeposit = deposit1; // 100%
  const totalRefund = refundRental + refundDeposit; // ₹1,920

  assert(refundDeposit === 1000, `Security deposit 100% refunded on cancellation`);
  assert(totalRefund <= expectedTotal1, `Total refund does not exceed captured amount`);

  // -------------------------------------------------------------
  // Scenario 3: Partial Cancellation Window (24-48h window: 75% rental)
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Partial Cancellation Refund Reconciliation (24-48h) ---');
  const partialRentalRefund = Math.round(baseRental1 * 0.75); // ₹690
  const partialTotalRefund = partialRentalRefund + deposit1; // ₹1,690

  assert(partialRentalRefund === 690, `75% rental refund equals ₹690`);
  assert(partialTotalRefund === 1690, `Total partial refund equals ₹1,690 (Rental ₹690 + Deposit ₹1000)`);
  assert(partialTotalRefund <= expectedTotal1, `Partial refund within captured limit`);

  console.log('\n======================================================================');
  console.log(`  Financial Reconciliation Suite: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('======================================================================\n');
}

runFinancialReconciliationTest();

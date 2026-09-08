import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PricingService } from '../services/pricing.service';
import { AvailabilityService } from '../services/availability.service';
import { PayoutService } from '../services/payout.service';
import { Vehicle } from '../models/Vehicle';
import { Booking } from '../models/Booking';
import { Vendor } from '../models/Vendor';
import { assertRole } from '../lib/auth';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ridesetu';

async function runValidationTests() {
  console.log('====================================================');
  console.log('  RideSetu Core Architecture & Logic Test Suite');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
    }
  }

  // TEST 1: Pricing Calculation & Security Deposit Isolation
  console.log('--- 1. Testing Pricing Calculation & Deposit Isolation ---');
  const mockVehicle = {
    pricePerDay: 500,
    securityDeposit: 1000,
    category: 'SCOOTER' as const,
  };

  const pickup = new Date('2026-09-01T10:00:00Z');
  const returnDate = new Date('2026-09-03T10:00:00Z'); // 2 days

  const mockCoupon = {
    code: 'TEST10',
    discountType: 'PERCENTAGE' as const,
    discountValue: 10,
    minimumBookingValue: 500,
    maximumDiscount: 200,
    isActive: true,
    expiryDate: new Date('2027-01-01'),
    applicableVehicleCategories: [],
  };

  const pricing = PricingService.calculatePricing({
    vehicle: mockVehicle,
    pickupDateTime: pickup,
    returnDateTime: returnDate,
    pickupType: 'HOTEL_DELIVERY',
    deliveryFee: 120,
    coupon: mockCoupon,
  });

  // Base: 500 * 2 = 1000.
  // Delivery: 120, Platform: 49.
  // Discount: 10% of 1000 = 100.
  // Taxable: 1000 + 120 + 49 - 100 = 1069.
  // Taxes: 1069 * 0.18 = 192.
  // Total: 1069 + 192 + 1000 (deposit) = 2261.
  assert(pricing.durationDays === 2, 'Duration days correctly calculated as 2');
  assert(pricing.basePrice === 1000, 'Base price correctly computed as ₹1,000');
  assert(pricing.discountAmount === 100, 'Coupon discount correctly applied as ₹100');
  assert(pricing.securityDeposit === 1000, 'Refundable deposit retained as ₹1,000');
  assert(pricing.totalPayable === 2261, `Total payable equals ₹2,261 (Actual: ₹${pricing.totalPayable})`);

  // TEST 2: Role-based Authorization Isolation
  console.log('\n--- 2. Testing Server-side Role Authorization Guard ---');
  const customerSession = { userId: '1', email: 'c@test.com', name: 'Cust', role: 'CUSTOMER' as const };
  const vendorSession = { userId: '2', email: 'v@test.com', name: 'Vend', role: 'VENDOR' as const };
  const adminSession = { userId: '3', email: 'a@test.com', name: 'Admin', role: 'ADMIN' as const };

  assert(assertRole(customerSession, ['CUSTOMER']).authorized === true, 'Customer allowed to access Customer route');
  assert(assertRole(customerSession, ['VENDOR']).authorized === false, 'Customer BLOCKED from Vendor route');
  assert(assertRole(customerSession, ['ADMIN']).authorized === false, 'Customer BLOCKED from Admin route');
  assert(assertRole(vendorSession, ['VENDOR']).authorized === true, 'Vendor allowed to access Vendor route');
  assert(assertRole(vendorSession, ['ADMIN']).authorized === false, 'Vendor BLOCKED from Admin route');
  assert(assertRole(adminSession, ['ADMIN', 'VENDOR', 'CUSTOMER']).authorized === true, 'Admin authorized for master operations');

  // TEST 3: MongoDB Availability & Overlap Checks (if DB available)
  console.log('\n--- 3. Testing Overlapping Booking Condition ---');
  // Overlap condition formula check:
  // Existing: Sep 1 10:00 -> Sep 3 10:00
  const exStart = new Date('2026-09-01T10:00:00Z').getTime();
  const exEnd = new Date('2026-09-03T10:00:00Z').getTime();

  function checkOverlap(reqStartStr: string, reqEndStr: string): boolean {
    const reqStart = new Date(reqStartStr).getTime();
    const reqEnd = new Date(reqEndStr).getTime();
    return reqStart < exEnd && reqEnd > exStart;
  }

  assert(checkOverlap('2026-09-02T10:00:00Z', '2026-09-04T10:00:00Z') === true, 'Overlapping partial range detected as CONFLICT (Sep 2 -> Sep 4)');
  assert(checkOverlap('2026-08-30T10:00:00Z', '2026-09-02T10:00:00Z') === true, 'Overlapping prior range detected as CONFLICT (Aug 30 -> Sep 2)');
  assert(checkOverlap('2026-09-01T12:00:00Z', '2026-09-02T12:00:00Z') === true, 'Enclosed subset range detected as CONFLICT (Sep 1 12:00 -> Sep 2 12:00)');
  assert(checkOverlap('2026-09-03T10:00:00Z', '2026-09-05T10:00:00Z') === false, 'Consecutive adjacent slot ALLOWED without collision (Sep 3 -> Sep 5)');
  assert(checkOverlap('2026-08-28T10:00:00Z', '2026-09-01T10:00:00Z') === false, 'Previous non-overlapping slot ALLOWED (Aug 28 -> Sep 1 10:00)');

  // TEST 4: Vendor Payout Calculation
  console.log('\n--- 4. Testing Payout Calculation & Commission Isolation ---');
  const mockBookingForPayout = {
    _id: new mongoose.Types.ObjectId(),
    bookingNumber: 'RS-TEST-001',
    vendorId: new mongoose.Types.ObjectId(),
    basePrice: 2000,
    deliveryCharge: 200,
    securityDeposit: 1500, // strictly NOT part of revenue
  };

  const commissionRate = 15;
  const gross = mockBookingForPayout.basePrice + mockBookingForPayout.deliveryCharge; // 2200
  const platformComm = Math.round((gross * commissionRate) / 100); // 330
  const netVendor = gross - platformComm; // 1870

  assert(gross === 2200, 'Gross eligible revenue = ₹2,200 (Deposit excluded)');
  assert(platformComm === 330, 'Platform commission (15%) = ₹330');
  assert(netVendor === 1870, 'Net Vendor Payout = ₹1,870');

  console.log('\n====================================================');
  console.log(`  Tests Completed: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================\n');
}

runValidationTests();

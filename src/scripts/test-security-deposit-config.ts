import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PricingService } from '../services/pricing.service';
import { PayoutService } from '../services/payout.service';

async function runSecurityDepositConfigTests() {
  console.log('======================================================================');
  console.log('  RideSetu — Configurable Security Deposit Test Suite');
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

  // 1. Test Deposit Enabled (Default)
  const vehicleDepositEnabled = {
    _id: new mongoose.Types.ObjectId(),
    pricePerDay: 500,
    securityDeposit: 1000,
    securityDepositEnabled: true,
    securityDepositAmount: 1000,
    category: 'SCOOTER' as const,
  };

  const pricingDepositEnabled = PricingService.calculatePricing({
    vehicle: vehicleDepositEnabled as any,
    pickupDateTime: new Date('2026-08-20T09:00:00Z'),
    returnDateTime: new Date('2026-08-21T20:00:00Z'),
  });

  assert(pricingDepositEnabled.securityDeposit === 1000, 'Deposit Enabled: Security deposit equals ₹1,000');
  assert(pricingDepositEnabled.totalPayable === 2238, 'Deposit Enabled: Total payable equals ₹2,238 (Base ₹1000 + Platform ₹49 + GST ₹189 + Deposit ₹1000)');

  // 2. Test Deposit Disabled
  const vehicleDepositDisabled = {
    _id: new mongoose.Types.ObjectId(),
    pricePerDay: 500,
    securityDeposit: 1000,
    securityDepositEnabled: false,
    securityDepositAmount: 0,
    category: 'SCOOTER' as const,
  };

  const pricingDepositDisabled = PricingService.calculatePricing({
    vehicle: vehicleDepositDisabled as any,
    pickupDateTime: new Date('2026-08-20T09:00:00Z'),
    returnDateTime: new Date('2026-08-21T20:00:00Z'),
  });

  assert(pricingDepositDisabled.securityDeposit === 0, 'Deposit Disabled: Security deposit equals ₹0');
  assert(pricingDepositDisabled.totalPayable === 1238, 'Deposit Disabled: Total payable equals ₹1,238 (Deposit excluded)');

  // 3. Test Custom Deposit Amount (e.g. ₹2,500 for Himalayan bike)
  const vehicleCustomDeposit = {
    _id: new mongoose.Types.ObjectId(),
    pricePerDay: 1200,
    securityDeposit: 2500,
    securityDepositEnabled: true,
    securityDepositAmount: 2500,
    category: 'MOTORCYCLE' as const,
  };

  const pricingCustomDeposit = PricingService.calculatePricing({
    vehicle: vehicleCustomDeposit as any,
    pickupDateTime: new Date('2026-08-20T09:00:00Z'),
    returnDateTime: new Date('2026-08-21T20:00:00Z'),
  });

  assert(pricingCustomDeposit.securityDeposit === 2500, 'Custom Deposit: Security deposit equals ₹2,500');
  assert(pricingCustomDeposit.totalPayable === 5390, 'Custom Deposit: Total payable equals ₹5,390 (Base ₹2400 + Platform ₹49 + GST ₹441 + Deposit ₹2500)');

  // 4. Test Vendor Payout Excludes Deposit
  const payoutCalculation = PayoutService.calculateVendorPayout(
    { basePrice: 2400, deliveryCharge: 0 },
    15
  );

  assert(payoutCalculation.eligibleGrossAmount === 2400, 'Vendor Payout: Gross eligible amount excludes security deposit (₹2,400)');
  assert(payoutCalculation.netPayoutAmount === 2040, 'Vendor Payout: Net payout equals ₹2,040 (Base ₹2400 - 15% Commission ₹360)');

  console.log('\n======================================================================');
  console.log(`  Configurable Security Deposit Suite: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('======================================================================\n');
}

runSecurityDepositConfigTests();

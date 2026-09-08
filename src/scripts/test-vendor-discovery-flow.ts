import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import assert from 'assert';

async function runVendorDiscoveryTest() {
  console.log('\n======================================================================');
  console.log('  RideSetu — STEP 25 Regression: Vendor Discovery Database Test Suite ');
  console.log('======================================================================\n');

  const baseUrl = 'http://localhost:3000';

  // 1. Search Vendors API Test
  console.log('[1] Testing POST /api/vendors/search for Rishikesh...');
  const resSearch = await fetch(`${baseUrl}/api/vendors/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'Rishikesh',
      pickupDateTime: '2026-08-28T10:00:00.000Z',
      returnDateTime: '2026-08-30T10:00:00.000Z',
      rentalMode: 'DAILY',
    }),
  });

  console.log(`    Status Code: ${resSearch.status} ${resSearch.statusText}`);
  const dataSearch = await resSearch.json();
  console.log(`    Vendors Found: ${dataSearch.vendors?.length || 0}`);
  assert.strictEqual(resSearch.status, 200, 'Vendor search returned HTTP 200 OK');
  assert.strictEqual(dataSearch.success, true, 'Vendor search returned success: true');
  assert(dataSearch.vendors && dataSearch.vendors.length > 0, 'Vendors list is non-empty');
  console.log('  ✅ [PASS] POST /api/vendors/search SUCCEEDED!\n');

  // 2. Vendor Storefront Details API Test (/api/vendors/[vendorId])
  const firstVendorId = dataSearch.vendors[0]._id;
  console.log(`[2] Testing GET /api/vendors/${firstVendorId}...`);
  const resVendor = await fetch(`${baseUrl}/api/vendors/${firstVendorId}`);
  console.log(`    Status Code: ${resVendor.status} ${resVendor.statusText}`);
  const dataVendor = await resVendor.json();
  console.log(`    Vendor Name: ${dataVendor.vendor?.businessName}`);
  console.log(`    Vehicles Count: ${dataVendor.vehicles?.length || 0}`);

  assert.strictEqual(resVendor.status, 200, 'Vendor details returned HTTP 200 OK');
  assert.strictEqual(dataVendor.success, true, 'Vendor details returned success: true');
  assert(dataVendor.vendor && dataVendor.vendor.businessName, 'Vendor profile returned');
  assert(dataVendor.vehicles && dataVendor.vehicles.length > 0, 'Vendor vehicles list returned');
  console.log(`  ✅ [PASS] GET /api/vendors/${firstVendorId} SUCCEEDED!\n`);

  console.log('======================================================================');
  console.log('  STEP 25 MONGODB VENDOR DISCOVERY VERIFIED 100% WORKING!              ');
  console.log('======================================================================\n');
}

runVendorDiscoveryTest();

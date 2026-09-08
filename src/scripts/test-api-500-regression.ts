import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import assert from 'assert';

async function runApiRegressionTest() {
  console.log('\n======================================================================');
  console.log('  RideSetu — API 500 Backend Regression Diagnostic Suite            ');
  console.log('======================================================================\n');

  const baseUrl = 'http://localhost:3000';

  // 1. Test POST /api/auth/login
  console.log('[1] Testing POST /api/auth/login with test customer account...');
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'customer@ridesetu.com',
        password: 'Password123!',
      }),
    });
    console.log(`    Status Code: ${res.status} ${res.statusText}`);
    const data = await res.json();
    assert(res.status !== 500, 'POST /api/auth/login must NOT return 500');
    assert(data.success === true, 'POST /api/auth/login returned success: true');
    console.log('  ✅ [PASS] POST /api/auth/login returned 200 OK without 500 error!');
  } catch (err: any) {
    console.error('  ❌ POST /api/auth/login error:', err.message);
  }

  // 2. Test POST /api/vendors/search
  console.log('\n[2] Testing POST /api/vendors/search with Rishikesh search query...');
  try {
    const res = await fetch(`${baseUrl}/api/vendors/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'Rishikesh',
        pickupDateTime: '2026-08-28T10:00:00.000Z',
        returnDateTime: '2026-08-30T10:00:00.000Z',
        rentalMode: 'DAILY',
      }),
    });
    console.log(`    Status Code: ${res.status} ${res.statusText}`);
    const data = await res.json();
    assert(res.status !== 500, 'POST /api/vendors/search must NOT return 500');
    assert(data.success === true, 'POST /api/vendors/search returned success: true');
    assert(Array.isArray(data.data), 'POST /api/vendors/search returned vendors array');
    console.log(`  ✅ [PASS] POST /api/vendors/search returned 200 OK (${data.data.length} vendors found) without 500 error!`);
  } catch (err: any) {
    console.error('  ❌ POST /api/vendors/search error:', err.message);
  }

  // 3. Test POST /api/group-booking
  console.log('\n[3] Testing POST /api/group-booking cart endpoint...');
  try {
    const res = await fetch(`${baseUrl}/api/group-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: '65e000000000000000000020',
        pickupDateTime: '2026-08-28T10:00:00.000Z',
        returnDateTime: '2026-08-30T10:00:00.000Z',
      }),
    });
    console.log(`    Status Code: ${res.status} ${res.statusText}`);
    assert(res.status !== 500, 'POST /api/group-booking must NOT return 500');
    console.log('  ✅ [PASS] POST /api/group-booking handled cleanly without 500 error!');
  } catch (err: any) {
    console.error('  ❌ POST /api/group-booking error:', err.message);
  }

  console.log('\n======================================================================');
  console.log('  API 500 DIAGNOSTIC SUITE COMPLETE                                   ');
  console.log('======================================================================\n');
}

runApiRegressionTest();

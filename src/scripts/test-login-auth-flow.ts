import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import assert from 'assert';

async function runLoginAuthFlowTest() {
  console.log('\n======================================================================');
  console.log('  RideSetu — STEP 25.1: Customer, Vendor & Admin Login Test Suite     ');
  console.log('======================================================================\n');

  const baseUrl = 'http://localhost:3000';

  // 1. Customer Login Test (customer@ridesetu.demo / Password123!)
  console.log('[1] Testing Customer Login: customer@ridesetu.demo / Password123! ...');
  const resCust = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'customer@ridesetu.demo',
      password: 'Password123!',
    }),
  });
  console.log(`    Status Code: ${resCust.status} ${resCust.statusText}`);
  const dataCust = await resCust.json();
  const cookiesCust = resCust.headers.get('set-cookie');
  console.log(`    Response Payload:`, dataCust);
  assert.strictEqual(resCust.status, 200, 'Customer login returned 200 OK');
  assert.strictEqual(dataCust.success, true, 'Customer login returned success: true');
  assert.strictEqual(dataCust.user.role, 'CUSTOMER', 'User role is CUSTOMER');
  assert(cookiesCust?.includes('ridesetu_token'), 'Session cookie ridesetu_token set');
  console.log('  ✅ [PASS] Customer Login (customer@ridesetu.demo) SUCCEEDED with HTTP 200 & JWT Cookie!\n');

  // 2. Vendor Login Test (vendor@ridesetu.demo / Password123!)
  console.log('[2] Testing Vendor Login: vendor@ridesetu.demo / Password123! ...');
  const resVend = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'vendor@ridesetu.demo',
      password: 'Password123!',
    }),
  });
  console.log(`    Status Code: ${resVend.status} ${resVend.statusText}`);
  const dataVend = await resVend.json();
  assert.strictEqual(resVend.status, 200, 'Vendor login returned 200 OK');
  assert.strictEqual(dataVend.success, true, 'Vendor login returned success: true');
  assert.strictEqual(dataVend.user.role, 'VENDOR', 'User role is VENDOR');
  console.log('  ✅ [PASS] Vendor Login (vendor@ridesetu.demo) SUCCEEDED with HTTP 200 & VENDOR role!\n');

  // 3. Admin Login Test (admin@ridesetu.demo / Password123!)
  console.log('[3] Testing Admin Login: admin@ridesetu.demo / Password123! ...');
  const resAdmin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@ridesetu.demo',
      password: 'Password123!',
    }),
  });
  console.log(`    Status Code: ${resAdmin.status} ${resAdmin.statusText}`);
  const dataAdmin = await resAdmin.json();
  assert.strictEqual(resAdmin.status, 200, 'Admin login returned 200 OK');
  assert.strictEqual(dataAdmin.success, true, 'Admin login returned success: true');
  assert.strictEqual(dataAdmin.user.role, 'ADMIN', 'User role is ADMIN');
  console.log('  ✅ [PASS] Admin Login (admin@ridesetu.demo) SUCCEEDED with HTTP 200 & ADMIN role!\n');

  // 4. Test GET /api/auth/me with session cookie
  console.log('[4] Testing GET /api/auth/me session persistence...');
  const resMe = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: cookiesCust || '' },
  });
  const dataMe = await resMe.json();
  assert.strictEqual(resMe.status, 200, 'GET /api/auth/me returned 200 OK');
  assert.strictEqual(dataMe.authenticated, true, 'GET /api/auth/me returned authenticated: true');
  assert.strictEqual(dataMe.user.role, 'CUSTOMER', 'Session profile role is CUSTOMER');
  console.log('  ✅ [PASS] Session Verification (/api/auth/me) SUCCEEDED!\n');

  // 5. Test Phone Login with Development Master OTP 123456
  console.log('[5] Testing Phone Login with Development Master OTP 123456...');
  const resSend = await fetch(`${baseUrl}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: '9876543210',
      method: 'SMS',
      purpose: 'SIGNUP',
    }),
  });
  const dataSend = await resSend.json();
  const challengeId = dataSend.challengeId || 'demo-challenge-id';

  const resOtp = await fetch(`${baseUrl}/api/auth/otp-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeId,
      phone: '9876543210',
      otp: '123456',
      name: 'Test Customer',
    }),
  });
  const dataOtp = await resOtp.json();
  console.log(`    Status Code: ${resOtp.status} ${resOtp.statusText}`);
  console.log(`    Response Payload:`, dataOtp);
  assert.strictEqual(resOtp.status, 200, 'OTP login status returned 200 OK');
  assert.strictEqual(dataOtp.success, true, 'OTP login returned success: true');
  console.log('  ✅ [PASS] Phone OTP Development Master Code (123456) SUCCEEDED!\n');

  console.log('======================================================================');
  console.log('  STEP 25.1 AUTHENTICATION ROOT CAUSE FIX VERIFIED 100%!             ');
  console.log('======================================================================\n');
}

runLoginAuthFlowTest();

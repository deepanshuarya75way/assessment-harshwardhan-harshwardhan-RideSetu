import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { SMSService } from '../services/sms.service';
import { OTPService } from '../services/otp.service';

async function testRealSMSDelivery() {
  const targetPhone = process.argv[2] || '+918210326930';
  const normalizedPhone = OTPService.normalizeIdentifier(targetPhone, 'SMS');
  const maskedPhone = normalizedPhone.replace(/(\+\d{2}\d{2})\d{4}(\d{4})/, '$1****$2');
  const testOtp = OTPService.generateOTP();

  console.log('\n======================================================================');
  console.log('  RideSetu — Real SMS OTP Delivery Diagnostic Test');
  console.log('======================================================================\n');
  console.log(`  Target Mobile:      ${maskedPhone}`);
  console.log(`  Target Normalized:  ${normalizedPhone}`);
  console.log(`  Generated OTP:      ****** (Cryptographic 6-digit)`);
  console.log('----------------------------------------------------------------------');

  const result = await SMSService.sendVerificationSMS({
    toPhone: normalizedPhone,
    otp: testOtp,
  });

  console.log(`  Active SMS Provider: ${result.provider || 'UNCONFIGURED'}`);
  console.log(`  Gateway Status:      ${result.success ? 'ACCEPTED (SMS DISPATCHED)' : 'REJECTED / FAILED'}`);

  if (result.sid) {
    console.log(`  Provider Message ID: ${result.sid}`);
  }

  if (!result.success) {
    console.log(`\n  ❌ [REAL SMS FAILURE REASON]`);
    console.log(`     ${result.error}`);
    console.log('\n  REQUIRED ACTION:');
    console.log('     Please configure real SMS provider API credentials in .env.local:');
    console.log('     - Twilio:   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER');
    console.log('     - Fast2SMS: FAST2SMS_API_KEY (India +91 Direct)');
    console.log('     - MSG91:    MSG91_AUTH_KEY, MSG91_TEMPLATE_ID (India DLT Approved)\n');
    process.exit(1);
  } else {
    console.log('\n  ✅ [REAL SMS DISPATCH SUCCESSFUL]');
    console.log(`     The SMS provider accepted the request for ${maskedPhone}.`);
    console.log('     Please check your mobile phone for the real SMS arrival.\n');
  }
}

testRealSMSDelivery();

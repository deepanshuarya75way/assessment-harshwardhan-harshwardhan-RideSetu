export interface SendSMSDTO {
  toPhone: string;
  otp: string;
}

export class SMSService {
  /**
   * Sends a real mobile SMS verification OTP via external SMS Gateway APIs (Twilio, Fast2SMS, or MSG91)
   */
  public static async sendVerificationSMS(dto: SendSMSDTO): Promise<{
    success: boolean;
    sid?: string;
    error?: string;
    provider?: string;
    isDevFallback?: boolean;
  }> {
    const cleanDigits = dto.toPhone.replace(/\D/g, '');
    const indian10Digit = cleanDigits.length === 10 ? cleanDigits : cleanDigits.slice(-10);
    const formattedE164 = dto.toPhone.startsWith('+') ? dto.toPhone : `+${cleanDigits}`;
    const maskedPhone = formattedE164.replace(/(\+\d{2}\d{2})\d{4}(\d{4})/, '$1****$2');

    // Environment Variables
    const smsProvider = (process.env.SMS_PROVIDER || '').toUpperCase();
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFromNumber = process.env.TWILIO_FROM_NUMBER;
    const fast2smsApiKey = process.env.FAST2SMS_API_KEY;
    const msg91AuthKey = process.env.MSG91_AUTH_KEY;
    const msg91TemplateId = process.env.MSG91_TEMPLATE_ID;

    // Determine Active SMS Gateway
    let activeProvider: 'TWILIO' | 'FAST2SMS' | 'MSG91' | 'NONE' = 'NONE';

    if (smsProvider === 'TWILIO' || (twilioAccountSid && twilioAuthToken && twilioFromNumber)) {
      activeProvider = 'TWILIO';
    } else if (smsProvider === 'FAST2SMS' || fast2smsApiKey) {
      activeProvider = 'FAST2SMS';
    } else if (smsProvider === 'MSG91' || msg91AuthKey) {
      activeProvider = 'MSG91';
    }

    if (activeProvider === 'NONE') {
      // DEVELOPMENT ONLY - REMOVE DEVELOPMENT OTP BEFORE PRODUCTION DEPLOYMENT
      if (process.env.NODE_ENV !== 'production') {
        console.log(`\n======================================================================`);
        console.log(`  [DEV TESTING OTP] Destination: ${maskedPhone}`);
        console.log(`  [DEV TESTING OTP] Development Testing Code: 123456`);
        console.log(`======================================================================\n`);

        return {
          success: true,
          provider: 'DEV_TESTING',
          sid: `dev_testing_${Date.now()}`,
          isDevFallback: true,
        };
      }

      console.error(`[SMS OTP ERROR] No real SMS provider credentials found in production.`);
      return {
        success: false,
        provider: 'UNCONFIGURED',
        error: 'SMS provider credentials missing in production environment.',
      };
    }

    try {
      // 1. TWILIO REAL SMS DISPATCH
      if (activeProvider === 'TWILIO') {
        if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
          throw new Error('Twilio configuration is incomplete. TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER are required.');
        }

        const credentials = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
        const params = new URLSearchParams();
        params.append('To', formattedE164);
        params.append('From', twilioFromNumber);
        params.append('Body', `Your RideSetu verification code is ${dto.otp}. Valid for 5 minutes.`);

        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.error(`[SMS DEBUG] Twilio Request Failed: HTTP ${res.status} - ${data.message || 'Twilio Error'}`);
          return {
            success: false,
            provider: 'TWILIO',
            error: data.message || `Twilio SMS dispatch failed (Code ${data.code || res.status}).`,
          };
        }

        console.log(`[SMS DEBUG] Provider: TWILIO | Target: ${maskedPhone} | Status: ACCEPTED | Message SID: ${data.sid}`);
        return {
          success: true,
          provider: 'TWILIO',
          sid: data.sid,
        };
      }

      // 2. FAST2SMS REAL SMS DISPATCH (INDIA SPECIFIC)
      if (activeProvider === 'FAST2SMS') {
        if (!fast2smsApiKey) {
          throw new Error('Fast2SMS API key (FAST2SMS_API_KEY) is missing in .env.local.');
        }

        const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(fast2smsApiKey)}&route=otp&variables_values=${encodeURIComponent(dto.otp)}&numbers=${encodeURIComponent(indian10Digit)}`;
        
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await res.json();

        if (!res.ok || !data.return) {
          console.error(`[SMS DEBUG] Fast2SMS Request Failed: ${data.message || 'Fast2SMS Error'}`);
          return {
            success: false,
            provider: 'FAST2SMS',
            error: data.message || 'Fast2SMS gateway rejected the SMS request.',
          };
        }

        console.log(`[SMS DEBUG] Provider: FAST2SMS | Target: ${maskedPhone} | Status: ACCEPTED | Request ID: ${data.request_id || data.message?.[0]}`);
        return {
          success: true,
          provider: 'FAST2SMS',
          sid: data.request_id || `f2s_${Date.now()}`,
        };
      }

      // 3. MSG91 REAL SMS DISPATCH (INDIA SPECIFIC)
      if (activeProvider === 'MSG91') {
        if (!msg91AuthKey || !msg91TemplateId) {
          throw new Error('MSG91 configuration incomplete. MSG91_AUTH_KEY and MSG91_TEMPLATE_ID are required.');
        }

        const res = await fetch(
          `https://control.msg91.com/api/v5/otp?template_id=${msg91TemplateId}&mobile=91${indian10Digit}&otp=${dto.otp}`,
          {
            method: 'POST',
            headers: {
              authkey: msg91AuthKey,
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await res.json();

        if (!res.ok || data.type !== 'success') {
          console.error(`[SMS DEBUG] MSG91 Request Failed: ${data.message || 'MSG91 Error'}`);
          return {
            success: false,
            provider: 'MSG91',
            error: data.message || 'MSG91 gateway rejected the SMS request.',
          };
        }

        console.log(`[SMS DEBUG] Provider: MSG91 | Target: ${maskedPhone} | Status: ACCEPTED | Request ID: ${data.request_id}`);
        return {
          success: true,
          provider: 'MSG91',
          sid: data.request_id,
        };
      }

      return {
        success: false,
        error: 'Unsupported SMS provider configuration.',
      };
    } catch (err: any) {
      console.error(`[SMSService Exception]:`, err?.message || err);
      return {
        success: false,
        provider: activeProvider,
        error: err?.message || 'Failed to dispatch real SMS via gateway.',
      };
    }
  }
}

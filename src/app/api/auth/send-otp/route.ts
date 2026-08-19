import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { OTPService } from '@/services/otp.service';
import { EmailService } from '@/services/email.service';
import { SMSService } from '@/services/sms.service';
import { AuditLog } from '@/models/AuditLog';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, method, purpose = 'SIGNUP' } = body;

    if (!identifier || !method || !['EMAIL', 'SMS'].includes(method)) {
      return NextResponse.json(
        { error: 'Valid identifier and method (EMAIL or SMS) are required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedIdentifier = OTPService.normalizeIdentifier(identifier, method);

    // Create OTP Challenge
    const challenge = await OTPService.createChallenge({
      identifier,
      method,
      purpose,
    });

    if (!challenge.success || !challenge.challengeId) {
      const status = challenge.code === 'OTP_RESEND_COOLDOWN' || challenge.code === 'OTP_RATE_LIMITED' ? 429 : 400;
      return NextResponse.json(
        { error: challenge.error || 'Failed to generate verification code.' },
        { status }
      );
    }

    // Send OTP via Real SMS Gateway or Email Service
    let deliverySuccess = false;
    let deliveryError: string | undefined = undefined;

    if (method === 'EMAIL') {
      const emailResult = await EmailService.sendVerificationEmail({
        toEmail: normalizedIdentifier,
        otp: challenge.rawOtp!,
      });
      deliverySuccess = emailResult.success;
      deliveryError = emailResult.error;
    } else {
      const smsResult = await SMSService.sendVerificationSMS({
        toPhone: normalizedIdentifier,
        otp: challenge.rawOtp!,
      });
      deliverySuccess = smsResult.success;
      deliveryError = smsResult.error;
    }

    // Strict Delivery Guard: If external SMS/Email provider rejects delivery, return error & do NOT pretend delivery succeeded!
    if (!deliverySuccess) {
      return NextResponse.json(
        {
          success: false,
          error: deliveryError || 'Real SMS delivery failed. Please check provider credentials in .env.local.',
        },
        { status: 500 }
      );
    }

    // Audit Log (NO PLAINTEXT OTP LOGGED)
    const maskedId = method === 'SMS' 
      ? normalizedIdentifier.replace(/(\+\d{2}\d{2})\d{4}(\d{4})/, '$1****$2')
      : normalizedIdentifier.replace(/(.{2})(.*)(?=@)/, '$1***');

    await AuditLog.create({
      action: 'OTP_SENT',
      userId: 'system',
      userRole: 'SYSTEM',
      resourceType: 'AUTH',
      details: {
        identifier: maskedId,
        method,
        purpose,
        challengeId: challenge.challengeId,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      challengeId: challenge.challengeId,
      expiresIn: challenge.expiresIn,
      resendAvailableIn: challenge.resendAvailableIn,
      message: `Verification code sent to your ${method === 'EMAIL' ? 'email address' : 'mobile number'}.`,
    });
  } catch (error: any) {
    console.error('[API Send OTP Error]:', error?.message || error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while sending verification code.' },
      { status: 500 }
    );
  }
}

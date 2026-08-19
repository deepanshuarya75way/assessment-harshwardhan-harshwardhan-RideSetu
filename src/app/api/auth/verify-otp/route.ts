import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { OTPService } from '@/services/otp.service';
import { AuditLog } from '@/models/AuditLog';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, identifier, otp, method, purpose = 'SIGNUP' } = body;

    if (!challengeId || !identifier || !otp || !method) {
      return NextResponse.json(
        { error: 'Challenge ID, identifier, method, and 6-digit OTP code are required.' },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit numeric verification code.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const verification = await OTPService.verifyChallenge({
      challengeId,
      identifier,
      otp: otp.trim(),
      method,
      purpose,
    });

    if (!verification.success || !verification.verified) {
      // Audit log failed attempt
      await AuditLog.create({
        action: 'OTP_FAILED',
        userId: 'system',
        userRole: 'SYSTEM',
        resourceType: 'AUTH',
        details: {
          challengeId,
          identifier: OTPService.normalizeIdentifier(identifier, method),
          method,
          code: verification.code,
        },
      }).catch(() => {});

      const status = verification.code === 'OTP_ATTEMPTS_EXCEEDED' ? 429 : 400;
      return NextResponse.json(
        { success: false, verified: false, code: verification.code, error: verification.error },
        { status }
      );
    }

    // Audit log successful verification
    await AuditLog.create({
      action: 'OTP_VERIFIED',
      userId: 'system',
      userRole: 'SYSTEM',
      resourceType: 'AUTH',
      details: {
        challengeId,
        identifier: OTPService.normalizeIdentifier(identifier, method),
        method,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      verified: true,
      challengeId,
      message: 'Verification code confirmed successfully.',
    });
  } catch (error: any) {
    console.error('[API Verify OTP Error]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while verifying the code.' },
      { status: 500 }
    );
  }
}

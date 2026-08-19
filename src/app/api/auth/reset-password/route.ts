import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { OTPService } from '@/services/otp.service';
import { hashPassword, signJwt, AUTH_COOKIE_NAME } from '@/lib/auth';
import { AuditLog } from '@/models/AuditLog';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, identifier, method = 'SMS', otp, newPassword } = body;

    if (!challengeId || !identifier || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Identifier, verification code, challenge ID, and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedIdentifier = OTPService.normalizeIdentifier(identifier, method);

    // 1. Verify OTP challenge with PASSWORD_RESET purpose
    const verification = await OTPService.verifyChallenge({
      challengeId,
      identifier: normalizedIdentifier,
      otp: otp.trim(),
      method,
      purpose: 'PASSWORD_RESET',
    });

    if (!verification.success || !verification.verified) {
      const status = verification.code === 'OTP_ATTEMPTS_EXCEEDED' ? 429 : 400;
      return NextResponse.json(
        { success: false, verified: false, code: verification.code, error: verification.error },
        { status }
      );
    }

    // 2. Find user by email or phone
    const query = method === 'EMAIL' ? { email: normalizedIdentifier } : { phone: normalizedIdentifier };
    const user = await User.findOne(query);

    // Account enumeration protection: Return generic success if no user found
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Password updated successfully.',
      });
    }

    // 3. Hash & update user password
    user.passwordHash = await hashPassword(newPassword);
    const providers = user.authProviders || [];
    if (!providers.includes('PASSWORD')) {
      providers.push('PASSWORD');
    }
    user.authProviders = providers;
    await user.save();

    // Consume challenge
    await OTPService.consumeChallenge({
      challengeId,
      identifier: normalizedIdentifier,
      method,
    }).catch(() => {});

    await AuditLog.create({
      action: 'PASSWORD_RESET_SUCCESS',
      userId: user._id.toString(),
      userRole: user.role,
      resourceType: 'USER',
      details: { identifier: normalizedIdentifier },
    }).catch(() => {});

    // 4. Create Session Payload & Sign JWT Cookie (Auto Login)
    const sessionPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = signJwt(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      message: 'Password reset successfully. You are now logged in.',
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('[API Reset Password Error]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while resetting your password.' },
      { status: 500 }
    );
  }
}

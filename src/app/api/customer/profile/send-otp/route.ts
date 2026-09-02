import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { OTPService } from '@/services/otp.service';
import { getSessionFromRequest } from '@/lib/auth';
import { EmailService } from '@/services/email.service';
import { SMSService } from '@/services/sms.service';

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { channel } = body; // 'EMAIL' | 'PHONE'

    if (channel !== 'EMAIL' && channel !== 'PHONE') {
      return NextResponse.json({ error: 'Invalid verification channel. Must be EMAIL or PHONE.' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const target = channel === 'EMAIL' ? user.email : user.phone;
    if (!target) {
      return NextResponse.json({ error: `No ${channel.toLowerCase()} address on file to verify.` }, { status: 400 });
    }

    const method = channel === 'EMAIL' ? 'EMAIL' : 'SMS';
    const result = await OTPService.createChallenge({
      identifier: target,
      method,
      purpose: 'VERIFICATION',
    });

    if (!result.success || !result.challengeId) {
      return NextResponse.json({ error: result.error || 'Failed to generate OTP' }, { status: 400 });
    }

    let devCode: string | undefined = undefined;
    if (method === 'EMAIL') {
      const emailRes = await EmailService.sendVerificationEmail({ toEmail: target, otp: result.rawOtp! });
      if (emailRes.isDevFallback) devCode = result.rawOtp;
    } else {
      const smsRes = await SMSService.sendVerificationSMS({ toPhone: target, otp: result.rawOtp! });
      if (smsRes.isDevFallback) devCode = result.rawOtp;
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to your ${channel.toLowerCase()}.`,
      challengeId: result.challengeId,
      devCode: process.env.NODE_ENV !== 'production' ? devCode : undefined,
    });
  } catch (error: any) {
    console.error('[API Send Profile OTP Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to send verification code' }, { status: 400 });
  }
}

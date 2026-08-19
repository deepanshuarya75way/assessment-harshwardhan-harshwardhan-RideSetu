import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Vendor } from '@/models/Vendor';
import { hashPassword, signJwt, AUTH_COOKIE_NAME } from '@/lib/auth';
import { OTPService } from '@/services/otp.service';
import { AuditLog } from '@/models/AuditLog';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      role = 'CUSTOMER',
      signupChallengeId,
      verificationMethod = 'EMAIL',
      businessName,
      city,
      destinationId,
      rentalLicenseNumber,
    } = body;

    // 1. Guard against public ADMIN registration attempts
    if (role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Public registration for Admin accounts is strictly prohibited.' },
        { status: 403 }
      );
    }

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, email, phone, and password are required.' },
        { status: 400 }
      );
    }

    if (role !== 'VENDOR' && (!signupChallengeId || !['EMAIL', 'SMS'].includes(verificationMethod))) {
      return NextResponse.json(
        { error: 'Verified OTP signup challenge ID and verification method are required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = OTPService.normalizeIdentifier(email, 'EMAIL');
    const normalizedPhone = OTPService.normalizeIdentifier(phone, 'SMS');
    const challengeTarget = verificationMethod === 'EMAIL' ? normalizedEmail : normalizedPhone;

    // 2. Consume OTP Challenge Atomically if provided
    if (signupChallengeId) {
      const challengeResult = await OTPService.consumeChallenge({
        challengeId: signupChallengeId,
        identifier: challengeTarget,
        method: verificationMethod as 'EMAIL' | 'SMS',
      });

      if (!challengeResult.success) {
        return NextResponse.json(
          { error: challengeResult.error || 'Your email/mobile verification code has expired or is invalid. Please verify again.' },
          { status: 400 }
        );
      }
    }

    // 3. Duplicate Account Prevention across normalized email and mobile
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });

    if (existingUser) {
      const field = existingUser.email === normalizedEmail ? 'email address' : 'mobile number';
      return NextResponse.json(
        { error: `An account with this ${field} already exists. Please sign in.` },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // 4. Create User Record
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
      role: role === 'VENDOR' ? 'VENDOR' : 'CUSTOMER',
      kycStatus: 'PENDING',
      drivingLicenseStatus: 'PENDING',
      emailVerified: verificationMethod === 'EMAIL',
      phoneVerified: verificationMethod === 'SMS',
    });

    let vendorId: string | undefined = undefined;
    if (role === 'VENDOR' && businessName && rentalLicenseNumber && destinationId) {
      const newVendor = await Vendor.create({
        userId: newUser._id,
        businessName: businessName.trim(),
        ownerName: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        address: body.address || 'Local Office',
        city: city || 'Rishikesh',
        destinationId,
        rentalLicenseNumber: rentalLicenseNumber.trim(),
        verificationStatus: 'UNDER_REVIEW',
        commissionRate: 15,
      });
      vendorId = newVendor._id.toString();
    }

    // Audit Logging
    await AuditLog.create({
      action: 'ACCOUNT_VERIFIED',
      userId: newUser._id.toString(),
      userRole: newUser.role,
      resourceType: 'USER',
      resourceId: newUser._id.toString(),
      details: {
        method: verificationMethod,
        email: newUser.email,
        phone: newUser.phone,
      },
    }).catch(() => {});

    const sessionPayload = {
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      vendorId,
    };

    const token = signJwt(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      message: 'Registration and verification successful.',
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('[API Register Error]:', error);
    const isDbError =
      error.name?.includes('Mongo') ||
      error.name?.includes('Mongoose') ||
      error.message?.includes('connect') ||
      error.message?.includes('whitelist') ||
      error.message?.includes('SSL') ||
      error.message?.includes('TLS');

    return NextResponse.json(
      {
        success: false,
        code: isDbError ? 'DATABASE_UNAVAILABLE' : 'REGISTER_ERROR',
        error: isDbError
          ? 'RideSetu is temporarily unable to connect to its services. Please try again shortly.'
          : 'Registration failed. Please check your details and try again.',
      },
      { status: 500 }
    );
  }
}

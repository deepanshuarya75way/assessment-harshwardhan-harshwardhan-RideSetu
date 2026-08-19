import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Vendor } from '@/models/Vendor';
import { signJwt, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { role } = await request.json(); // 'CUSTOMER' | 'VENDOR' | 'ADMIN'

    const emailMap: Record<string, string> = {
      CUSTOMER: 'customer@ridesetu.demo',
      VENDOR: 'vendor@ridesetu.demo',
      ADMIN: 'admin@ridesetu.demo',
    };

    const targetEmail = emailMap[role] || 'customer@ridesetu.demo';

    await connectToDatabase();
    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      return NextResponse.json(
        { error: `Demo account ${targetEmail} not found. Please run seed.` },
        { status: 404 }
      );
    }

    let vendorId: string | undefined = undefined;
    if (user.role === 'VENDOR') {
      const vendor = await Vendor.findOne({ userId: user._id });
      if (vendor) {
        vendorId = vendor._id.toString();
      }
    }

    const sessionPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      vendorId,
    };

    const token = signJwt(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      message: `Switched to demo role: ${user.role}`,
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
    console.error('[API Switch Demo Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to switch demo account' },
      { status: 500 }
    );
  }
}

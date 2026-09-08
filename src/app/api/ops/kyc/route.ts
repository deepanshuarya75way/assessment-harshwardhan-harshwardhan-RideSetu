import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { KYCVerification } from '@/models/KYCVerification';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    await connectToDatabase();

    const pendingKyc = await KYCVerification.find({})
      .populate('userId', 'name email phone kycStatus drivingLicenseStatus')
      .sort({ submittedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: pendingKyc.length,
      submissions: pendingKyc,
    });
  } catch (error: any) {
    console.error('Error fetching admin KYC submissions:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

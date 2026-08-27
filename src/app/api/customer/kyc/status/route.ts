import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { KYCVerification } from '@/models/KYCVerification';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    const uObjectId = new mongoose.Types.ObjectId(session.userId);

    const user = await User.findById(uObjectId)
      .select('kycStatus drivingLicenseStatus drivingLicenseExpiry emailVerified phoneVerified')
      .lean();

    const latestKyc = await KYCVerification.findOne({ userId: uObjectId })
      .sort({ createdAt: -1 })
      .select('status expiryDate vehicleClasses rejectionReason maskedLicenceNumber')
      .lean();

    const now = new Date();
    const isDlExpired = latestKyc?.expiryDate ? new Date(latestKyc.expiryDate) <= now : true;
    const isKycVerified = user?.kycStatus === 'VERIFIED' && latestKyc?.status === 'VERIFIED';
    const isEligibleForBooking = isKycVerified && !isDlExpired;

    return NextResponse.json({
      kycStatus: user?.kycStatus || 'NOT_STARTED',
      drivingLicenseStatus: user?.drivingLicenseStatus || 'NOT_STARTED',
      isDlExpired,
      isKycVerified,
      isEligibleForBooking,
      vehicleClasses: latestKyc?.vehicleClasses || ['MCWG'],
      maskedLicenceNumber: latestKyc?.maskedLicenceNumber || '',
      rejectionReason: latestKyc?.rejectionReason || '',
      expiryDate: latestKyc?.expiryDate || user?.drivingLicenseExpiry || null,
      emailVerified: Boolean(user?.emailVerified),
      phoneVerified: Boolean(user?.phoneVerified),
    });
  } catch (error: any) {
    console.error('[API Customer KYC Status Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to check KYC status' }, { status: 500 });
  }
}

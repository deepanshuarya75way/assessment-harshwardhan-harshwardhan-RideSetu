import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { KYCVerification } from '@/models/KYCVerification';
import { User } from '@/models/User';
import { Notification } from '@/models/Notification';

export async function POST(
  req: NextRequest,
  { params }: { params: { kycId: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    const { kycId } = params;
    const body = await req.json();
    const { action, rejectionReason, adminNotes } = body; // APPROVE, REJECT

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Valid review action (APPROVE or REJECT) is required' }, { status: 400 });
    }

    if (action === 'REJECT' && (!rejectionReason || rejectionReason.trim().length < 3)) {
      return NextResponse.json({ error: 'Rejection reason is required when rejecting a document' }, { status: 400 });
    }

    await connectToDatabase();

    const kycRecord = await KYCVerification.findById(kycId);
    if (!kycRecord) {
      return NextResponse.json({ error: 'KYC submission not found' }, { status: 404 });
    }

    const dbUser = await User.findById(kycRecord.userId);
    if (!dbUser) {
      return NextResponse.json({ error: 'User associated with KYC not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      kycRecord.status = 'VERIFIED';
      kycRecord.verifiedAt = new Date();
      kycRecord.adminNotes = adminNotes || 'Approved by Operations Console';
      await kycRecord.save();

      if (kycRecord.documentType === 'DRIVING_LICENCE') {
        dbUser.drivingLicenseStatus = 'VERIFIED';
      }
      dbUser.kycStatus = 'VERIFIED';
      await dbUser.save();

      await Notification.create({
        userId: dbUser._id,
        title: 'Identity Document Verified',
        message: `Your ${kycRecord.documentType.replace('_', ' ')} has been verified. You can now use Smart KYC for instant bookings.`,
        type: 'KYC_VERIFIED',
      });
    } else {
      kycRecord.status = 'REJECTED';
      kycRecord.rejectedAt = new Date();
      kycRecord.rejectionReason = rejectionReason;
      kycRecord.adminNotes = adminNotes || '';
      await kycRecord.save();

      if (kycRecord.documentType === 'DRIVING_LICENCE') {
        dbUser.drivingLicenseStatus = 'REJECTED';
      }
      dbUser.kycStatus = 'REJECTED';
      await dbUser.save();

      await Notification.create({
        userId: dbUser._id,
        title: 'Document Verification Update',
        message: `Your ${kycRecord.documentType.replace('_', ' ')} submission requires replacement: ${rejectionReason}`,
        type: 'KYC_REJECTED',
      });
    }

    return NextResponse.json({
      success: true,
      kycId: kycRecord._id.toString(),
      status: kycRecord.status,
      userKycStatus: dbUser.kycStatus,
      message: `KYC submission ${action.toLowerCase()}d successfully.`,
    });
  } catch (error: any) {
    console.error('Error reviewing KYC submission:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

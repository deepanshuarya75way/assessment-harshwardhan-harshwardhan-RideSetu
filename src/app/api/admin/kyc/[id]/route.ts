import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { KYCVerification, KYCVerificationStatus } from '@/models/KYCVerification';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { getSessionFromRequest, assertRole } from '@/lib/auth';
import { maskEmail, maskPhone } from '@/lib/encryption';
import { KYCStateMachine } from '@/services/kyc-provider.service';
import { getPrivateStorageProvider } from '@/services/document-storage.service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const auth = assertRole(session, ['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid KYC case ID format' }, { status: 400 });
    }

    await connectToDatabase();
    const kycCase = await KYCVerification.findById(id)
      .populate('userId', 'name email phone avatar emailVerified phoneVerified dateOfBirth emergencyContact')
      .populate('reviewedBy', 'name email')
      .lean();

    if (!kycCase) {
      return NextResponse.json({ error: 'KYC case not found' }, { status: 404 });
    }

    const storageProvider = getPrivateStorageProvider();
    const [frontSigned, backSigned] = await Promise.all([
      storageProvider.getSignedDocumentUrl(kycCase.documentFrontStorageKey, session.userId, session.role, 900),
      storageProvider.getSignedDocumentUrl(kycCase.documentBackStorageKey, session.userId, session.role, 900),
    ]);

    const user: any = kycCase.userId || {};

    const caseDetails = {
      _id: kycCase._id,
      userId: user._id,
      customerName: user.name || kycCase.nameOnLicence,
      customerEmail: maskEmail(user.email || ''),
      customerPhone: maskPhone(user.phone || ''),
      emailVerified: Boolean(user.emailVerified),
      phoneVerified: Boolean(user.phoneVerified),
      emergencyContact: user.emergencyContact,
      status: kycCase.status,
      documentType: kycCase.documentType,
      maskedLicenceNumber: kycCase.maskedLicenceNumber,
      nameOnLicence: kycCase.nameOnLicence,
      dateOfBirth: kycCase.dateOfBirth,
      issueDate: kycCase.issueDate,
      expiryDate: kycCase.expiryDate,
      vehicleClasses: kycCase.vehicleClasses,
      documentFrontSignedUrl: frontSigned.signedUrl,
      documentBackSignedUrl: backSigned.signedUrl,
      documentExpiresAt: frontSigned.expiresAt,
      verificationProvider: kycCase.verificationProvider,
      verificationReference: kycCase.verificationReference,
      submittedAt: kycCase.submittedAt,
      verifiedAt: kycCase.verifiedAt,
      rejectedAt: kycCase.rejectedAt,
      rejectionReason: kycCase.rejectionReason,
      adminNotes: kycCase.adminNotes,
      reviewedBy: (kycCase.reviewedBy as any)?.name || null,
    };

    return NextResponse.json({ kycCase: caseDetails });
  } catch (error: any) {
    console.error('[API Admin KYC Detail GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch KYC case' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const auth = assertRole(session, ['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid KYC case ID format' }, { status: 400 });
    }

    const body = await request.json();
    const { action, reason = '', adminNotes = '' } = body; // action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO'

    if (!action || !['APPROVE', 'REJECT', 'REQUEST_INFO'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid review action. Allowed: APPROVE, REJECT, REQUEST_INFO.' },
        { status: 400 }
      );
    }

    if ((action === 'REJECT' || action === 'REQUEST_INFO') && (!reason || !reason.trim())) {
      return NextResponse.json(
        { error: 'A specific reason is mandatory when rejecting or requesting additional info.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const kycCase = await KYCVerification.findById(id);
    if (!kycCase) {
      return NextResponse.json({ error: 'KYC case not found' }, { status: 404 });
    }

    // Determine next state
    let targetStatus: KYCVerificationStatus = 'VERIFIED';
    if (action === 'REJECT') targetStatus = 'REJECTED';
    if (action === 'REQUEST_INFO') targetStatus = 'ACTION_REQUIRED';

    // State machine check
    KYCStateMachine.assertTransition(kycCase.status, targetStatus);

    const now = new Date();
    const adminObjectId = new mongoose.Types.ObjectId(session.userId);

    kycCase.status = targetStatus;
    kycCase.adminNotes = adminNotes.trim();
    kycCase.reviewedBy = adminObjectId;

    if (action === 'APPROVE') {
      kycCase.verifiedAt = now;
      kycCase.rejectionReason = '';
    } else if (action === 'REJECT') {
      kycCase.rejectedAt = now;
      kycCase.rejectionReason = reason.trim();
    } else if (action === 'REQUEST_INFO') {
      kycCase.rejectionReason = reason.trim();
      kycCase.reverificationRequired = true;
    }

    await kycCase.save();

    // Synchronize User profile status
    await User.findByIdAndUpdate(kycCase.userId, {
      $set: {
        kycStatus: targetStatus,
        drivingLicenseStatus: targetStatus,
        drivingLicenseExpiry: kycCase.expiryDate,
      },
    });

    // Record AuditLog entry
    await AuditLog.create({
      action: `KYC_${action}_BY_ADMIN`,
      userId: adminObjectId,
      userRole: 'ADMIN',
      resourceType: 'KYC_VERIFICATION',
      resourceId: kycCase._id.toString(),
      details: {
        customerUserId: kycCase.userId.toString(),
        previousStatus: kycCase.status,
        newStatus: targetStatus,
        action,
        reason: reason.trim() || undefined,
        adminNotes: adminNotes.trim() || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: `KYC verification case successfully ${action.toLowerCase()}d.`,
      status: targetStatus,
    });
  } catch (error: any) {
    console.error('[API Admin KYC PATCH Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update KYC case' }, { status: 400 });
  }
}

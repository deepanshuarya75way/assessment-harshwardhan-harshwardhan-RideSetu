import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { KYCVerification } from '@/models/KYCVerification';
import { User } from '@/models/User';
import { getSessionFromRequest, assertRole } from '@/lib/auth';
import { maskEmail, maskPhone } from '@/lib/encryption';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    const auth = assertRole(session, ['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    await connectToDatabase();

    const query: Record<string, any> = {};
    if (statusFilter && statusFilter !== 'ALL') {
      query.status = statusFilter;
    }

    const skip = (page - 1) * limit;

    const [kycCases, totalCount] = await Promise.all([
      KYCVerification.find(query)
        .populate('userId', 'name email phone avatar emailVerified phoneVerified')
        .sort({ submittedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      KYCVerification.countDocuments(query),
    ]);

    // Data minimization: mask email & phone in lists
    const formattedCases = kycCases.map((k: any) => {
      const user = k.userId || {};
      return {
        _id: k._id,
        userId: user._id,
        customerName: user.name || k.nameOnLicence,
        customerEmailMasked: maskEmail(user.email || ''),
        customerPhoneMasked: maskPhone(user.phone || ''),
        avatar: user.avatar || '',
        emailVerified: Boolean(user.emailVerified),
        phoneVerified: Boolean(user.phoneVerified),
        status: k.status,
        documentType: k.documentType,
        maskedLicenceNumber: k.maskedLicenceNumber,
        nameOnLicence: k.nameOnLicence,
        expiryDate: k.expiryDate,
        vehicleClasses: k.vehicleClasses,
        verificationProvider: k.verificationProvider,
        verificationReference: k.verificationReference,
        submittedAt: k.submittedAt,
        verifiedAt: k.verifiedAt,
        rejectedAt: k.rejectedAt,
        rejectionReason: k.rejectionReason,
      };
    });

    const summary = {
      pendingReview: await KYCVerification.countDocuments({ status: 'UNDER_REVIEW' }),
      verified: await KYCVerification.countDocuments({ status: 'VERIFIED' }),
      rejected: await KYCVerification.countDocuments({ status: 'REJECTED' }),
      actionRequired: await KYCVerification.countDocuments({ status: 'ACTION_REQUIRED' }),
    };

    return NextResponse.json({
      kycCases: formattedCases,
      summary,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('[API Admin KYC List Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch KYC queue' }, { status: 500 });
  }
}

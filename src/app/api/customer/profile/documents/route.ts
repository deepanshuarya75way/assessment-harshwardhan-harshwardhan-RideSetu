import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { User } from '@/models/User';
import { KYCVerification } from '@/models/KYCVerification';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { documentType, documentNumber, documentFileUrl } = body;

    if (!documentType || !['DRIVING_LICENCE', 'AADHAAR'].includes(documentType)) {
      return NextResponse.json({ error: 'Valid documentType (DRIVING_LICENCE or AADHAAR) is required' }, { status: 400 });
    }

    if (!documentNumber || documentNumber.trim().length < 4) {
      return NextResponse.json({ error: 'Valid document number is required' }, { status: 400 });
    }

    await connectToDatabase();

    const maskedNumber =
      documentType === 'AADHAAR'
        ? `XXXX-XXXX-${documentNumber.slice(-4)}`
        : `XXXXXX${documentNumber.slice(-4)}`;

    // Upsert KYCVerification Record
    let kycRecord = await KYCVerification.findOne({ userId: user.userId || (user as any).id, documentType });

    if (kycRecord) {
      kycRecord.status = 'UNDER_REVIEW';
      kycRecord.maskedLicenceNumber = maskedNumber;
      kycRecord.documentFrontStorageKey = documentFileUrl || '/uploads/kyc_doc.jpg';
      kycRecord.submittedAt = new Date();
      kycRecord.rejectionReason = '';
      await kycRecord.save();
    } else {
      kycRecord = await KYCVerification.create({
        userId: user.userId || (user as any).id,
        documentType,
        status: 'UNDER_REVIEW',
        licenceNumberEncrypted: 'enc_' + documentNumber,
        maskedLicenceNumber: maskedNumber,
        nameOnLicence: user.name,
        dateOfBirth: new Date(1995, 0, 1),
        issueDate: new Date(2020, 0, 1),
        expiryDate: new Date(2030, 0, 1),
        vehicleClasses: ['MCWG', 'LMV'],
        documentFrontStorageKey: documentFileUrl || '/uploads/kyc_doc.jpg',
        documentBackStorageKey: documentFileUrl || '/uploads/kyc_doc.jpg',
        verificationMethod: 'ADMIN_REVIEW',
        verificationProvider: 'ADMIN_REVIEW',
        verificationReference: `KYC_${Date.now()}`,
        submittedAt: new Date(),
        reverificationRequired: false,
      });
    }

    // Update User KYC statuses
    const dbUser = await User.findById(user.userId || (user as any).id);
    if (dbUser) {
      if (documentType === 'DRIVING_LICENCE') {
        dbUser.drivingLicenseStatus = 'UNDER_REVIEW';
        dbUser.drivingLicenseNumber = documentNumber.trim();
      }
      dbUser.kycStatus = 'UNDER_REVIEW';
      await dbUser.save();
    }

    return NextResponse.json({
      success: true,
      document: {
        id: kycRecord._id.toString(),
        documentType: kycRecord.documentType,
        status: kycRecord.status,
        maskedNumber: kycRecord.maskedLicenceNumber,
        submittedAt: kycRecord.submittedAt,
      },
      message: 'Document submitted for verification. Status set to UNDER_REVIEW.',
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

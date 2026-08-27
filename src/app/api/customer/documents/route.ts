import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { User } from '@/models/User';
import { KYCVerification } from '@/models/KYCVerification';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = user.userId || (user as any).id;
    const documents = await KYCVerification.find({ userId }).lean();

    const formatted = documents.map((doc) => ({
      id: doc._id.toString(),
      documentType: doc.documentType,
      status: doc.status,
      maskedNumber: doc.maskedLicenceNumber || 'XXXX-XXXX-1234',
      nameOnLicence: doc.nameOnLicence,
      expiryDate: doc.expiryDate,
      submittedAt: doc.submittedAt,
      verifiedAt: doc.verifiedAt,
      rejectionReason: doc.rejectionReason || '',
    }));

    return NextResponse.json({
      success: true,
      documents: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching customer documents:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { documentType, documentNumber, documentFileUrl, nameOnDocument, expiryDate } = body;

    if (!documentType || !['DRIVING_LICENCE', 'AADHAAR'].includes(documentType)) {
      return NextResponse.json({ error: 'Valid documentType (DRIVING_LICENCE or AADHAAR) is required' }, { status: 400 });
    }

    if (!documentNumber || documentNumber.trim().length < 4) {
      return NextResponse.json({ error: 'Valid document number is required' }, { status: 400 });
    }

    // Aadhaar specific validation: 12-digit format check
    if (documentType === 'AADHAAR') {
      const cleanAadhaar = documentNumber.replace(/\D/g, '');
      if (cleanAadhaar.length !== 12) {
        return NextResponse.json({ error: 'Aadhaar card number must be a valid 12-digit number' }, { status: 400 });
      }
    }

    // Driving License format validation check
    if (documentType === 'DRIVING_LICENCE') {
      const cleanDl = documentNumber.trim();
      if (cleanDl.length < 5) {
        return NextResponse.json({ error: 'Driving License number is invalid' }, { status: 400 });
      }
    }

    await connectToDatabase();

    const userId = user.userId || (user as any).id;
    const cleanNumber = documentNumber.trim();

    const maskedNumber =
      documentType === 'AADHAAR'
        ? `XXXX-XXXX-${cleanNumber.replace(/\D/g, '').slice(-4)}`
        : `XXXXXX${cleanNumber.slice(-4)}`;

    let kycRecord = await KYCVerification.findOne({ userId, documentType });

    if (kycRecord) {
      kycRecord.status = 'UNDER_REVIEW';
      kycRecord.maskedLicenceNumber = maskedNumber;
      if (documentFileUrl) kycRecord.documentFrontStorageKey = documentFileUrl;
      kycRecord.nameOnLicence = nameOnDocument || user.name;
      if (expiryDate) kycRecord.expiryDate = new Date(expiryDate);
      kycRecord.submittedAt = new Date();
      kycRecord.rejectionReason = '';
      await kycRecord.save();
    } else {
      kycRecord = await KYCVerification.create({
        userId,
        documentType,
        status: 'UNDER_REVIEW',
        licenceNumberEncrypted: 'enc_' + cleanNumber,
        maskedLicenceNumber: maskedNumber,
        nameOnLicence: nameOnDocument || user.name,
        dateOfBirth: new Date(1995, 0, 1),
        issueDate: new Date(2020, 0, 1),
        expiryDate: expiryDate ? new Date(expiryDate) : new Date(2030, 0, 1),
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

    // Update User model fields
    const dbUser = await User.findById(userId);
    if (dbUser) {
      if (documentType === 'DRIVING_LICENCE') {
        dbUser.drivingLicenseStatus = 'UNDER_REVIEW';
        dbUser.drivingLicenseNumber = cleanNumber;
      } else if (documentType === 'AADHAAR') {
        dbUser.aadhaarStatus = 'UNDER_REVIEW';
        dbUser.aadhaarNumberMasked = maskedNumber;
      }
      dbUser.kycStatus = 'UNDER_REVIEW';
      await dbUser.save();
    }

    try {
      const { NotificationService } = await import('@/services/notification.service');
      await NotificationService.notifyKycSubmitted({
        userId: userId.toString(),
        documentType,
      });
    } catch (e) {
      console.error('KYC notification error:', e);
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
      message: 'Document submitted successfully and is pending verification.',
    });
  } catch (error: any) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { KYCVerification } from '@/models/KYCVerification';
import { AuditLog } from '@/models/AuditLog';
import { getSessionFromRequest } from '@/lib/auth';
import { encryptFinancialData, maskDrivingLicence } from '@/lib/encryption';
import { validateDrivingLicenceFields, getKYCProvider } from '@/services/kyc-provider.service';
import { getPrivateStorageProvider } from '@/services/document-storage.service';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    const uObjectId = new mongoose.Types.ObjectId(session.userId);

    const activeKyc = await KYCVerification.findOne({ userId: uObjectId })
      .sort({ createdAt: -1 })
      .lean();

    const user = await User.findById(uObjectId).select('kycStatus drivingLicenseStatus drivingLicenseExpiry name dateOfBirth').lean();

    if (!activeKyc) {
      return NextResponse.json({
        exists: false,
        status: user?.kycStatus || 'NOT_STARTED',
        kyc: null,
      });
    }

    // FINANCIAL & IDENTITY PRIVACY: Never return raw DL number or encrypted string
    const safeKyc = {
      _id: activeKyc._id,
      status: activeKyc.status,
      documentType: activeKyc.documentType,
      maskedLicenceNumber: activeKyc.maskedLicenceNumber || maskDrivingLicence(activeKyc.nameOnLicence),
      nameOnLicence: activeKyc.nameOnLicence,
      dateOfBirth: activeKyc.dateOfBirth,
      issueDate: activeKyc.issueDate,
      expiryDate: activeKyc.expiryDate,
      vehicleClasses: activeKyc.vehicleClasses,
      documentFrontStorageKey: activeKyc.documentFrontStorageKey,
      documentBackStorageKey: activeKyc.documentBackStorageKey,
      verificationProvider: activeKyc.verificationProvider,
      verificationReference: activeKyc.verificationReference,
      submittedAt: activeKyc.submittedAt,
      verifiedAt: activeKyc.verifiedAt,
      rejectedAt: activeKyc.rejectedAt,
      rejectionReason: activeKyc.rejectionReason,
      reverificationRequired: activeKyc.reverificationRequired,
    };

    return NextResponse.json({
      exists: true,
      status: activeKyc.status,
      kyc: safeKyc,
    });
  } catch (error: any) {
    console.error('[API Customer KYC GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch KYC details' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      licenceNumber,
      nameOnLicence,
      dateOfBirth,
      issueDate,
      expiryDate,
      vehicleClasses = ['MCWG'],
      documentFrontBase64,
      documentFrontName = 'dl_front.jpg',
      documentBackBase64,
      documentBackName = 'dl_back.jpg',
    } = body;

    // 1. Validate Driving Licence fields
    const dlValidation = validateDrivingLicenceFields({
      licenceNumber,
      nameOnLicence,
      dateOfBirth,
      issueDate,
      expiryDate,
      vehicleClasses,
    });

    if (!dlValidation.isValid) {
      return NextResponse.json({ error: dlValidation.error }, { status: 400 });
    }

    if (!documentFrontBase64 || !documentBackBase64) {
      return NextResponse.json(
        { error: 'Both Driving Licence Front and Back document scans are required.' },
        { status: 400 }
      );
    }

    // 2. Decode and Validate Document Files (Magic bytes, extension, max size)
    const storageProvider = getPrivateStorageProvider();

    const frontBuffer = Buffer.from(
      documentFrontBase64.replace(/^data:[^;]+;base64,/, ''),
      'base64'
    );
    const backBuffer = Buffer.from(
      documentBackBase64.replace(/^data:[^;]+;base64,/, ''),
      'base64'
    );

    const frontUpload = await storageProvider.uploadPrivateDocument(
      frontBuffer,
      documentFrontName,
      'image/jpeg',
      session.userId
    );

    const backUpload = await storageProvider.uploadPrivateDocument(
      backBuffer,
      documentBackName,
      'image/jpeg',
      session.userId
    );

    await connectToDatabase();
    const uObjectId = new mongoose.Types.ObjectId(session.userId);

    // 3. Encrypt DL Number with AES-256-GCM
    const licenceNumberEncrypted = encryptFinancialData(licenceNumber.trim().toUpperCase());
    const maskedLicenceNumber = maskDrivingLicence(licenceNumber);

    // 4. Submit to KYC Provider (Sets state to UNDER_REVIEW)
    const kycProvider = getKYCProvider();
    const submissionResult = await kycProvider.submitVerification({
      userId: session.userId,
      documentType: 'DRIVING_LICENCE',
      nameOnLicence: nameOnLicence.trim(),
      dateOfBirth: new Date(dateOfBirth),
      issueDate: new Date(issueDate),
      expiryDate: new Date(expiryDate),
      vehicleClasses,
      documentFrontStorageKey: frontUpload.storageKey,
      documentBackStorageKey: backUpload.storageKey,
    });

    // 5. Save KYC Record (never sets VERIFIED automatically on upload)
    const kycDoc = await KYCVerification.create({
      userId: uObjectId,
      status: submissionResult.status, // 'UNDER_REVIEW'
      documentType: 'DRIVING_LICENCE',
      licenceNumberEncrypted,
      maskedLicenceNumber,
      nameOnLicence: nameOnLicence.trim(),
      dateOfBirth: new Date(dateOfBirth),
      issueDate: new Date(issueDate),
      expiryDate: new Date(expiryDate),
      vehicleClasses,
      documentFrontStorageKey: frontUpload.storageKey,
      documentBackStorageKey: backUpload.storageKey,
      verificationMethod: submissionResult.verificationMethod,
      verificationProvider: submissionResult.providerName,
      verificationReference: submissionResult.verificationReference,
      submittedAt: new Date(),
    });

    // 6. Update User Profile KYC state
    await User.findByIdAndUpdate(uObjectId, {
      $set: {
        kycStatus: 'UNDER_REVIEW',
        drivingLicenseStatus: 'UNDER_REVIEW',
        drivingLicenseNumber: maskedLicenceNumber,
        drivingLicenseExpiry: new Date(expiryDate),
        dateOfBirth: new Date(dateOfBirth),
      },
    });

    // 7. Record AuditLog
    await AuditLog.create({
      action: 'KYC_SUBMITTED',
      userId: uObjectId,
      userRole: session.role,
      resourceType: 'KYC_VERIFICATION',
      resourceId: kycDoc._id.toString(),
      details: {
        documentType: 'DRIVING_LICENCE',
        maskedLicenceNumber,
        verificationReference: submissionResult.verificationReference,
        provider: submissionResult.providerName,
        status: submissionResult.status,
      },
    });

    return NextResponse.json(
      {
        success: true,
        status: submissionResult.status,
        verificationReference: submissionResult.verificationReference,
        message: 'Your Driving Licence and documents have been submitted for RideSetu administrative review.',
        maskedLicenceNumber,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API Customer KYC POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit KYC documents' }, { status: 400 });
  }
}

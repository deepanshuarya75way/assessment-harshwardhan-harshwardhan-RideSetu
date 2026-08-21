import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vendor } from '@/models/Vendor';
import { VendorDocument, VendorDocType } from '@/models/VendorDocument';
import {
  getPrivateStorageProvider,
  validateDocumentFile,
} from '@/services/document-storage.service';
import { getSessionFromRequest, assertRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const auth = assertRole(session, ['VENDOR', 'ADMIN']);
    if (!auth.authorized || !session) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    await connectToDatabase();

    let vendor = null;
    if (session.vendorId && mongoose.Types.ObjectId.isValid(session.vendorId)) {
      vendor = await Vendor.findById(session.vendorId);
    } else if (session.userId) {
      vendor = await Vendor.findOne({ userId: session.userId });
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const docs = await VendorDocument.find({ vendorId: vendor._id }).sort({ createdAt: -1 });

    const storageProvider = getPrivateStorageProvider();
    const signedDocs = await Promise.all(
      docs.map(async (d) => {
        let previewUrl = null;
        try {
          const signed = await storageProvider.getSignedDocumentUrl(
            d.storageKey,
            session.userId,
            session.role,
            600 // 10 minutes
          );
          previewUrl = signed.signedUrl;
        } catch {
          previewUrl = null;
        }

        return {
          _id: d._id,
          docType: d.docType,
          originalFileName: d.originalFileName,
          status: d.status,
          rejectionReason: d.rejectionReason,
          fileSize: d.fileSize,
          mimeType: d.mimeType,
          previewUrl,
          createdAt: d.createdAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      documents: signedDocs,
    });
  } catch (error: any) {
    console.error('[API Vendor Documents GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch vendor documents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const auth = assertRole(session, ['VENDOR', 'ADMIN']);
    if (!auth.authorized || !session) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    await connectToDatabase();

    let vendor = null;
    if (session.vendorId && mongoose.Types.ObjectId.isValid(session.vendorId)) {
      vendor = await Vendor.findById(session.vendorId);
    } else if (session.userId) {
      vendor = await Vendor.findOne({ userId: session.userId });
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile required before uploading documents.' }, { status: 404 });
    }

    const body = await req.json();
    const { docType, fileBase64, originalFileName, vehicleId } = body;

    if (!docType || !fileBase64 || !originalFileName) {
      return NextResponse.json(
        { error: 'Document type, file payload, and filename are required.' },
        { status: 400 }
      );
    }

    // Decode Base64
    const base64Data = fileBase64.includes(';base64,')
      ? fileBase64.split(';base64,').pop()
      : fileBase64;
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Extract claimed MIME type
    let claimedMime = 'application/pdf';
    if (fileBase64.startsWith('data:image/jpeg') || originalFileName.toLowerCase().endsWith('.jpg') || originalFileName.toLowerCase().endsWith('.jpeg')) {
      claimedMime = 'image/jpeg';
    } else if (fileBase64.startsWith('data:image/png') || originalFileName.toLowerCase().endsWith('.png')) {
      claimedMime = 'image/png';
    }

    // Validate with Magic Bytes and Size Guard (<5MB)
    const validation = validateDocumentFile(fileBuffer, originalFileName, claimedMime);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error || 'Invalid document file' }, { status: 400 });
    }

    // Store in private storage provider
    const storageProvider = getPrivateStorageProvider();
    const uploadResult = await storageProvider.uploadPrivateDocument(
      fileBuffer,
      originalFileName,
      validation.detectedMimeType || claimedMime,
      session.userId
    );

    // Create or update VendorDocument record
    const vendorDoc = await VendorDocument.create({
      vendorId: vendor._id,
      userId: new mongoose.Types.ObjectId(session.userId),
      vehicleId: vehicleId && mongoose.Types.ObjectId.isValid(vehicleId) ? new mongoose.Types.ObjectId(vehicleId) : undefined,
      docType: docType as VendorDocType,
      originalFileName: uploadResult.sanitizedFileName,
      storageKey: uploadResult.storageKey,
      fileSize: fileBuffer.length,
      mimeType: validation.detectedMimeType || claimedMime,
      status: 'UNDER_REVIEW',
    });

    // Update vendor document reference
    if (docType === 'TRADE_LICENSE') {
      vendor.documents.tradeLicenseUrl = uploadResult.storageKey;
      if (!vendor.documentStatus) vendor.documentStatus = {};
      vendor.documentStatus.tradeLicense = 'UNDER_REVIEW';
    } else if (docType === 'GST_CERTIFICATE') {
      vendor.documents.gstCertificateUrl = uploadResult.storageKey;
      if (!vendor.documentStatus) vendor.documentStatus = {};
      vendor.documentStatus.gstCertificate = 'UNDER_REVIEW';
    } else if (docType === 'OWNER_ID') {
      vendor.documents.identityProofUrl = uploadResult.storageKey;
      if (!vendor.documentStatus) vendor.documentStatus = {};
      vendor.documentStatus.identityProof = 'UNDER_REVIEW';
    } else if (docType === 'RENTAL_PERMIT') {
      vendor.documents.rentalPermitUrl = uploadResult.storageKey;
      if (!vendor.documentStatus) vendor.documentStatus = {};
      vendor.documentStatus.rentalPermit = 'UNDER_REVIEW';
    }

    await vendor.save();

    // Generate signed preview URL
    const signed = await storageProvider.getSignedDocumentUrl(
      uploadResult.storageKey,
      session.userId,
      session.role,
      600
    );

    return NextResponse.json({
      success: true,
      document: {
        _id: vendorDoc._id,
        docType: vendorDoc.docType,
        originalFileName: vendorDoc.originalFileName,
        status: vendorDoc.status,
        previewUrl: signed.signedUrl,
      },
      message: 'Document uploaded securely and queued for RideSetu review.',
    });
  } catch (error: any) {
    console.error('[API Vendor Documents POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Document upload failed' }, { status: 500 });
  }
}

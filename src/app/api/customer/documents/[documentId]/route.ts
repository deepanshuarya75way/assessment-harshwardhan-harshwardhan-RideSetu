import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { KYCVerification } from '@/models/KYCVerification';

export async function GET(
  req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = params;
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    const userId = user.userId || (user as any).id;
    const document = await KYCVerification.findById(documentId).lean();

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // STRICT OWNERSHIP VERIFICATION:
    // Only the authenticated document owner (or ADMIN) can access document details
    if (document.userId.toString() !== userId.toString() && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Access denied to this document' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document._id.toString(),
        documentType: document.documentType,
        status: document.status,
        maskedNumber: document.maskedLicenceNumber || 'XXXX-XXXX-1234',
        nameOnLicence: document.nameOnLicence,
        dateOfBirth: document.dateOfBirth,
        expiryDate: document.expiryDate,
        submittedAt: document.submittedAt,
        verifiedAt: document.verifiedAt,
        rejectionReason: document.rejectionReason || '',
      },
    });
  } catch (error: any) {
    console.error('Error fetching document details:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

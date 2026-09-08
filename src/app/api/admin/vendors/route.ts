import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vendor } from '@/models/Vendor';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { VendorDocument } from '@/models/VendorDocument';
import { getPrivateStorageProvider } from '@/services/document-storage.service';
import { getSessionFromRequest, assertRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const auth = assertRole(session, ['ADMIN']);
    if (!auth.authorized || !session) {
      return NextResponse.json({ error: auth.error || 'Admin authorization required' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const query: Record<string, any> = {};
    if (statusFilter && statusFilter !== 'ALL') {
      query.verificationStatus = statusFilter;
    }

    const vendors = await Vendor.find(query)
      .populate('userId', 'name email phone role')
      .populate('destinationId', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    const storageProvider = getPrivateStorageProvider();

    // Fetch associated documents with admin signed preview URLs
    const enhancedVendors = await Promise.all(
      vendors.map(async (v: any) => {
        const docs = await VendorDocument.find({ vendorId: v._id }).lean();
        const signedDocs = await Promise.all(
          docs.map(async (d: any) => {
            let previewUrl = null;
            try {
              const signed = await storageProvider.getSignedDocumentUrl(
                d.storageKey,
                session.userId,
                'ADMIN',
                1800 // 30 mins
              );
              previewUrl = signed.signedUrl;
            } catch {
              previewUrl = null;
            }
            return {
              ...d,
              previewUrl,
            };
          })
        );

        return {
          ...v,
          uploadedDocuments: signedDocs,
        };
      })
    );

    return NextResponse.json({
      success: true,
      vendors: enhancedVendors,
      count: enhancedVendors.length,
    });
  } catch (error: any) {
    console.error('[API Admin Vendors GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch vendors' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const auth = assertRole(session, ['ADMIN']);
    if (!auth.authorized || !session) {
      return NextResponse.json({ error: auth.error || 'Admin authorization required' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await req.json();
    const { vendorId, action, reason = '', notes = '' } = body;

    if (!vendorId || !action) {
      return NextResponse.json({ error: 'Vendor ID and action are required.' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return NextResponse.json({ error: 'Invalid Vendor ID format' }, { status: 400 });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const prevStatus = vendor.verificationStatus;

    if (action === 'APPROVE') {
      vendor.verificationStatus = 'VERIFIED';
      vendor.rejectionReason = '';
      vendor.reviewedAt = new Date();
      vendor.reviewedBy = new mongoose.Types.ObjectId(session.userId);
      // Mark all pending vendor docs as verified
      await VendorDocument.updateMany(
        { vendorId: vendor._id, status: 'UNDER_REVIEW' },
        { status: 'VERIFIED', verifiedAt: new Date(), verifiedBy: new mongoose.Types.ObjectId(session.userId) }
      );
    } else if (action === 'REJECT') {
      if (!reason || reason.trim().length === 0) {
        return NextResponse.json({ error: 'A valid rejection reason is mandatory when rejecting a vendor application.' }, { status: 400 });
      }
      vendor.verificationStatus = 'REJECTED';
      vendor.rejectionReason = reason;
      vendor.reviewedAt = new Date();
      vendor.reviewedBy = new mongoose.Types.ObjectId(session.userId);
    } else if (action === 'REQUEST_INFO') {
      vendor.verificationStatus = 'ACTION_REQUIRED';
      vendor.rejectionReason = reason || 'Additional information or documents requested by RideSetu Admin.';
      vendor.reviewedAt = new Date();
      vendor.reviewedBy = new mongoose.Types.ObjectId(session.userId);
    } else if (action === 'SUSPEND') {
      vendor.verificationStatus = 'SUSPENDED';
      vendor.suspendedReason = reason || 'Vendor suspended by RideSetu Administration.';
      vendor.isActive = false;
      vendor.reviewedAt = new Date();
      vendor.reviewedBy = new mongoose.Types.ObjectId(session.userId);
    } else {
      return NextResponse.json({ error: `Invalid admin action "${action}".` }, { status: 400 });
    }

    await vendor.save();

    // Create Audit Log
    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(session.userId),
      action: `VENDOR_${action}`,
      resourceType: 'VENDOR',
      resourceId: vendor._id.toString(),
      metadata: {
        vendorName: vendor.businessName,
        prevStatus,
        newStatus: vendor.verificationStatus,
        reason,
        notes,
        adminEmail: session.email,
      },
    });

    return NextResponse.json({
      success: true,
      vendor,
      message: `Vendor application ${action.toLowerCase()}d successfully.`,
    });
  } catch (error: any) {
    console.error('[API Admin Vendors PATCH Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update vendor' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Payout, PayoutStatus } from '@/models/Payout';
import { PayoutService } from '@/services/payout.service';
import { getSessionFromRequest } from '@/lib/auth';
import { NotificationService } from '@/services/notification.service';
import { AuditLogService } from '@/services/audit.service';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendorId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }
    if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
      query.vendorId = new mongoose.Types.ObjectId(vendorId);
    }

    let total = 0;
    let payouts: any[] = [];

    try {
      if (mongoose.connection.readyState === 1) {
        total = await Payout.countDocuments(query);
        payouts = await Payout.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('vendorId')
          .populate('bookingId')
          .lean();
      }
    } catch {
      total = 0;
      payouts = [];
    }

    return NextResponse.json({
      success: true,
      payouts: payouts.map((p) => ({
        id: p._id.toString(),
        payoutId: p._id.toString(),
        vendorId: p.vendorId?._id?.toString() || p.vendorId?.toString(),
        vendorName: p.vendorId?.businessName || 'Vendor',
        bookingId: p.bookingId?._id?.toString() || p.bookingId?.toString(),
        bookingNumber: p.bookingId?.bookingNumber || 'N/A',
        grossAmount: p.grossAmount,
        platformCommission: p.platformCommission,
        taxes: p.taxes || 0,
        netAmount: p.netAmount,
        status: p.status,
        provider: p.provider,
        providerReference: p.providerReference,
        bankAccountRef: p.bankAccountRef || 'Registered Bank Account',
        holdReason: p.holdReason,
        createdAt: new Date(p.createdAt).toISOString(),
        paidAt: p.paidAt ? new Date(p.paidAt).toISOString() : null,
      })),
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error: any) {
    console.error('[API /api/ops/payouts GET Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin payouts' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { payoutId, action, reason } = body;

    if (!payoutId || !action) {
      return NextResponse.json({ error: 'payoutId and action are required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(payoutId)) {
      return NextResponse.json({ error: 'Invalid payoutId format' }, { status: 400 });
    }

    const payout = await Payout.findById(payoutId).populate('vendorId');
    if (!payout) {
      return NextResponse.json({ error: 'Payout record not found' }, { status: 404 });
    }

    let targetStatus: PayoutStatus = payout.status;
    if (action === 'APPROVE') {
      targetStatus = 'ELIGIBLE';
    } else if (action === 'HOLD') {
      targetStatus = 'ON_HOLD';
    } else if (action === 'EXECUTE' || action === 'PROCESS') {
      // Execute simulated / TEST MODE payout transfer
      const result = await PayoutService.executePayout(payoutId, session.userId);
      return NextResponse.json({
        success: true,
        message: 'Payout transfer executed successfully (TEST MODE).',
        payout: result.payout,
      });
    } else if (action === 'RETRY') {
      targetStatus = 'ELIGIBLE';
    } else {
      return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    const updatedPayout = await PayoutService.updatePayoutStatus(
      payoutId,
      targetStatus,
      reason || `Admin action: ${action}`,
      session.userId
    );

    // Trigger Notification
    const vendorUserId = (payout.vendorId as any)?.userId?.toString() || payout.vendorId.toString();
    if (targetStatus === 'ON_HOLD') {
      await NotificationService.notifyPayoutOnHold({
        vendorUserId,
        payoutId,
        amount: payout.netAmount,
        reason: reason || 'Compliance Hold',
      });
    } else if (targetStatus === 'ELIGIBLE') {
      await NotificationService.notifyPayoutEligible({
        vendorUserId,
        payoutId,
        amount: payout.netAmount,
        bookingNumber: 'N/A',
      });
    }

    return NextResponse.json({
      success: true,
      message: `Payout status updated to ${targetStatus}`,
      payout: updatedPayout,
    });
  } catch (error: any) {
    console.error('[API /api/ops/payouts PATCH Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update payout status' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Payout } from '@/models/Payout';
import { Vendor } from '@/models/Vendor';
import { Booking } from '@/models/Booking';
import { AuditLog } from '@/models/AuditLog';
import { getSessionFromRequest, assertRole } from '@/lib/auth';
import { PayoutService } from '@/services/payout.service';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const vendorFilter = searchParams.get('vendorId');

    const query: Record<string, unknown> = {};
    if (statusFilter) query.status = statusFilter;
    if (vendorFilter && mongoose.Types.ObjectId.isValid(vendorFilter)) {
      query.vendorId = new mongoose.Types.ObjectId(vendorFilter);
    }

    const payouts = await Payout.find(query)
      .populate('vendorId', 'businessName ownerName email phone bankAccountReference')
      .populate('bookingId', 'bookingNumber pickupDateTime returnDateTime totalPayable')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate aggregated metrics
    const totalPaid = payouts
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + (p.netAmount || 0), 0);
    const totalEligible = payouts
      .filter((p) => p.status === 'ELIGIBLE')
      .reduce((sum, p) => sum + (p.netAmount || 0), 0);
    const totalOnHold = payouts
      .filter((p) => p.status === 'ON_HOLD')
      .reduce((sum, p) => sum + (p.netAmount || 0), 0);
    const totalCommissions = payouts.reduce((sum, p) => sum + (p.platformCommission || 0), 0);

    return NextResponse.json({
      payouts,
      summary: {
        totalPaid,
        totalEligible,
        totalOnHold,
        totalCommissions,
        count: payouts.length,
      },
    });
  } catch (error: any) {
    console.error('[API Admin Payouts GET Error]:', error);
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

    const body = await request.json();
    const { payoutId, status, reason = '' } = body;

    if (!payoutId || !status) {
      return NextResponse.json(
        { error: 'payoutId and new status are required.' },
        { status: 400 }
      );
    }

    const updatedPayout = await PayoutService.updatePayoutStatus(
      payoutId,
      status,
      reason,
      session.userId
    );

    return NextResponse.json({
      success: true,
      payout: updatedPayout,
      message: `Payout status updated to ${status}.`,
    });
  } catch (error: any) {
    console.error('[API Admin Payouts PATCH Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update payout status' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const body = await request.json();
    const { payoutId } = body;

    if (!payoutId) {
      return NextResponse.json({ error: 'payoutId is required.' }, { status: 400 });
    }

    const result = await PayoutService.executePayout(payoutId, session.userId);

    return NextResponse.json({
      success: true,
      payout: result.payout,
      message: result.message || 'Payout transfer initiated successfully.',
    });
  } catch (error: any) {
    console.error('[API Admin Payouts POST Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute payout transfer' },
      { status: 400 }
    );
  }
}

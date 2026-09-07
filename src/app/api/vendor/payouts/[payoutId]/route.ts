import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vendor } from '@/models/Vendor';
import { Payout } from '@/models/Payout';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { payoutId: string } }) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();

    const payoutId = params.payoutId;
    if (!mongoose.Types.ObjectId.isValid(payoutId)) {
      return NextResponse.json({ error: 'Invalid Payout ID' }, { status: 400 });
    }

    let payout: any = null;
    try {
      payout = await Payout.findById(payoutId).populate('bookingId').populate('vendorId').lean();
    } catch {
      payout = null;
    }

    if (!payout) {
      return NextResponse.json({ error: 'Payout record not found' }, { status: 404 });
    }

    // Tenant Isolation Security Guard
    if (session.role === 'VENDOR') {
      let vendorIdStr = session.vendorId;
      if (!vendorIdStr) {
        const vendor = await Vendor.findOne({ userId: new mongoose.Types.ObjectId(session.userId) }).lean();
        if (vendor) vendorIdStr = vendor._id.toString();
      }

      if (payout.vendorId?._id?.toString() !== vendorIdStr && payout.vendorId?.toString() !== vendorIdStr) {
        return NextResponse.json({ error: 'Unauthorized access to payout record' }, { status: 403 });
      }
    } else if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: payout._id.toString(),
        payoutId: payout._id.toString(),
        vendorId: payout.vendorId?._id?.toString() || payout.vendorId?.toString(),
        vendorName: payout.vendorId?.businessName || 'Partner Vendor',
        bookingId: payout.bookingId?._id?.toString() || payout.bookingId?.toString(),
        bookingNumber: payout.bookingId?.bookingNumber || 'N/A',
        vehicleName: payout.bookingId?.vehicleId?.model ? `${payout.bookingId.vehicleId.brand} ${payout.bookingId.vehicleId.model}` : 'Rental Vehicle',
        grossAmount: payout.grossAmount,
        platformCommission: payout.platformCommission,
        commissionPercentage: payout.commissionPercentage || 15,
        taxes: payout.taxes || 0,
        netAmount: payout.netAmount,
        status: payout.status,
        provider: payout.provider,
        providerReference: payout.providerReference,
        bankAccountRef: payout.bankAccountRef || 'Registered Bank Account',
        holdReason: payout.holdReason,
        notes: payout.notes,
        paidAt: payout.paidAt ? new Date(payout.paidAt).toISOString() : null,
        createdAt: new Date(payout.createdAt).toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[API /api/vendor/payouts/[payoutId] GET Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payout detail' },
      { status: 500 }
    );
  }
}

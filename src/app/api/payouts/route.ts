import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Payout } from '@/models/Payout';
import { getSessionFromRequest, assertRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    const query: Record<string, unknown> = {};

    if (session.role === 'VENDOR') {
      if (!session.vendorId) return NextResponse.json({ payouts: [] });
      query.vendorId = new mongoose.Types.ObjectId(session.vendorId);
    }

    const payouts = await Payout.find(query)
      .populate('bookingId', 'bookingNumber basePrice deliveryCharge securityDeposit')
      .populate('vendorId', 'businessName ownerName bankAccountReference')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ payouts });
  } catch (error: any) {
    console.error('[API Payouts GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payouts' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    const authCheck = assertRole(session, ['ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { payoutId, status, providerReference } = await request.json();
    await connectToDatabase();

    const payout = await Payout.findByIdAndUpdate(
      payoutId,
      {
        status,
        providerReference: providerReference || `TXN_${Date.now()}`,
        paidAt: status === 'PAID' ? new Date() : undefined,
      },
      { new: true }
    );

    return NextResponse.json({ success: true, payout, message: 'Payout updated.' });
  } catch (error: any) {
    console.error('[API Payouts PATCH Error]:', error);
    return NextResponse.json({ error: error.message || 'Payout update failed' }, { status: 500 });
  }
}

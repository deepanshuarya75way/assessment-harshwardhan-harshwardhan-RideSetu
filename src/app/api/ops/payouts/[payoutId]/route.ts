import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Payout } from '@/models/Payout';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { payoutId: string } }) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    await connectToDatabase();

    const payoutId = params.payoutId;
    if (!mongoose.Types.ObjectId.isValid(payoutId)) {
      return NextResponse.json({ error: 'Invalid payoutId format' }, { status: 400 });
    }

    const payout = await Payout.findById(payoutId)
      .populate('vendorId')
      .populate('bookingId')
      .lean();

    if (!payout) {
      return NextResponse.json({ error: 'Payout record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      payout,
    });
  } catch (error: any) {
    console.error('[API /api/ops/payouts/[payoutId] GET Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin payout detail' },
      { status: 500 }
    );
  }
}

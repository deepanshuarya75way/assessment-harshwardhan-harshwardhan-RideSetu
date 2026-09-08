import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { bookingId } = params;
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID format' }, { status: 400 });
    }

    await connectToDatabase();
    const bObjectId = new mongoose.Types.ObjectId(bookingId);

    const booking = await Booking.findById(bObjectId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { consentGranted } = await request.json();

    return NextResponse.json({
      success: true,
      bookingId,
      consentGranted: Boolean(consentGranted),
      message: consentGranted
        ? 'Live location sharing consent granted.'
        : 'Live location sharing consent revoked.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update location consent' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { BookingService } from '@/services/booking.service';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();

    const booking = await Booking.findById(id)
      .populate('vehicleId')
      .populate('vendorId')
      .populate('destinationId')
      .populate('handoverPickupId')
      .populate('handoverReturnId')
      .lean();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Role-based Access check
    if (
      session.role === 'CUSTOMER' &&
      booking.customerId.toString() !== session.userId
    ) {
      return NextResponse.json({ error: 'Unauthorized to view this booking' }, { status: 403 });
    }

    if (
      session.role === 'VENDOR' &&
      session.vendorId &&
      booking.vendorId._id.toString() !== session.vendorId
    ) {
      return NextResponse.json({ error: 'Unauthorized to view this booking' }, { status: 403 });
    }

    return NextResponse.json({ booking });
  } catch (error: any) {
    console.error('[API Booking Single GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { action, reason } = body;

    await connectToDatabase();
    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (action === 'CANCEL') {
      const result = await BookingService.cancelBooking({
        bookingId: id,
        userId: session.userId,
        role: session.role,
        vendorId: session.vendorId,
        reason: reason || 'Requested cancellation.',
      });
      return NextResponse.json({
        success: true,
        booking: result.booking,
        refundSummary: result.refundSummary,
        message: 'Booking cancelled successfully.',
      });
    }

    if (action === 'COMPLETE') {
      if (session.role !== 'VENDOR' && session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only vendor or admin can complete a ride.' }, { status: 403 });
      }
      const updated = await BookingService.completeBooking(id);
      return NextResponse.json({ success: true, booking: updated, message: 'Ride completed and payout scheduled.' });
    }

    if (action === 'START_RIDE') {
      booking.bookingStatus = 'ACTIVE';
      booking.depositStatus = 'HELD';
      await booking.save();
      return NextResponse.json({ success: true, booking, message: 'Ride marked as Active.' });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('[API Booking Single PATCH Error]:', error);
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 });
  }
}

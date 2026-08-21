import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/models/Booking';
import { ReservationLock } from '@/models/ReservationLock';
import { Notification } from '@/models/Notification';

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || (user.role !== 'VENDOR' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized vendor access' }, { status: 403 });
    }

    const { bookingId } = params;
    const body = await req.json();
    const { reason } = body;

    if (!reason || reason.trim().length < 3) {
      return NextResponse.json({ error: 'A valid rejection reason is required' }, { status: 400 });
    }

    await connectToDatabase();

    let booking: any = null;
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await Booking.findById(bookingId);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingNumber: bookingId });
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    booking.bookingStatus = 'CANCELLED_BY_VENDOR';
    booking.cancellationReason = reason;
    booking.cancelledBy = 'VENDOR';
    booking.cancelledAt = new Date();
    await booking.save();

    // Release ReservationLock
    await ReservationLock.updateMany(
      { bookingId: booking._id },
      { $set: { status: 'RELEASED' } }
    );

    // Create Notification
    await Notification.create({
      userId: booking.customerId,
      title: 'Booking Declined by Vendor',
      message: `Booking #${booking.bookingNumber} was declined: ${reason}. A full refund is being processed.`,
      type: 'BOOKING_CANCELLED',
      data: { bookingId: booking._id.toString(), reason },
    });

    return NextResponse.json({
      success: true,
      bookingNumber: booking.bookingNumber,
      status: booking.bookingStatus,
      message: 'Booking declined and reservation locks released.',
    });
  } catch (error: any) {
    console.error('Error rejecting vendor booking:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

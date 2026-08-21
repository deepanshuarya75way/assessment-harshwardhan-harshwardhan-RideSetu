import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/models/Booking';
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

    booking.bookingStatus = 'READY_FOR_HANDOVER';
    await booking.save();

    await Notification.create({
      userId: booking.customerId,
      title: 'Vehicle Ready for Handover',
      message: `Your vehicle for booking #${booking.bookingNumber} is prepared and ready.`,
      type: 'BOOKING_UPDATED',
      data: { bookingId: booking._id.toString() },
    });

    return NextResponse.json({
      success: true,
      bookingNumber: booking.bookingNumber,
      status: booking.bookingStatus,
      message: 'Vehicle marked ready for handover.',
    });
  } catch (error: any) {
    console.error('Error marking vehicle ready:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

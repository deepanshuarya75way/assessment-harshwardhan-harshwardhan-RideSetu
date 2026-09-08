import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { CancellationService } from '@/services/cancellation.service';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ error: 'Valid booking ID is required.' }, { status: 400 });
    }

    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    // Role-based access validation
    if (session.role === 'CUSTOMER' && booking.customerId.toString() !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized to view this booking cancellation details' }, { status: 403 });
    }

    if (session.role === 'VENDOR' && session.vendorId && booking.vendorId.toString() !== session.vendorId) {
      return NextResponse.json({ error: 'Unauthorized to view this booking cancellation details' }, { status: 403 });
    }

    if (booking.bookingStatus === 'COMPLETED') {
      return NextResponse.json({ error: 'Completed bookings cannot be cancelled.' }, { status: 400 });
    }

    if (
      booking.bookingStatus === 'CANCELLED' ||
      booking.bookingStatus === 'CANCELLED_BY_CUSTOMER' ||
      booking.bookingStatus === 'CANCELLED_BY_VENDOR' ||
      booking.bookingStatus === 'CANCELLED_BY_ADMIN'
    ) {
      return NextResponse.json({ error: 'Booking is already cancelled.' }, { status: 400 });
    }

    let calculation: any;
    if (session.role === 'VENDOR') {
      calculation = CancellationService.calculateVendorCancellationRefund(booking);
    } else if (session.role === 'ADMIN') {
      calculation = CancellationService.calculateAdminCancellationRefund(booking);
    } else {
      calculation = CancellationService.calculateCustomerCancellationRefund({ booking });
    }

    return NextResponse.json({
      bookingNumber: booking.bookingNumber,
      pickupDateTime: booking.pickupDateTime,
      calculation,
    });
  } catch (error: any) {
    console.error('[API Cancellation Preview Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to calculate cancellation preview' }, { status: 500 });
  }
}

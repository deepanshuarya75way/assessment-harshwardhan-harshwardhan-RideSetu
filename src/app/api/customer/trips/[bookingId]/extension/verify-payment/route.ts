import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/models/Booking';
import { GroupBooking } from '@/models/GroupBooking';
import { ReservationLock } from '@/models/ReservationLock';
import { Payment } from '@/models/Payment';
import { Notification } from '@/models/Notification';
import { RazorpayService } from '@/services/razorpay.service';

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = params;
    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, newReturnDateTime, amount } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !newReturnDateTime) {
      return NextResponse.json({ error: 'Missing payment verification details' }, { status: 400 });
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

    // Verify signature via RazorpayService
    const isValidSignature = RazorpayService.verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature || 'dev_mock_signature',
    });

    if (!isValidSignature && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const newReturnDate = new Date(newReturnDateTime);

    // Update Booking atomically
    booking.returnDateTime = newReturnDate;
    booking.rentalDurationDays += 1;
    booking.totalPayable += amount || 0;
    booking.bookingStatus = 'EXTENDED';
    await booking.save();

    // Update GroupBooking if applicable
    if (booking.groupBookingId) {
      await GroupBooking.updateOne(
        { groupId: booking.groupBookingId },
        { $set: { returnDateTime: newReturnDate }, $inc: { totalPayable: amount || 0 } }
      );
      await Booking.updateMany(
        { groupBookingId: booking.groupBookingId, _id: { $ne: booking._id } },
        { $set: { returnDateTime: newReturnDate, bookingStatus: 'EXTENDED' } }
      );
    }

    // Update ReservationLock
    await ReservationLock.updateMany(
      { bookingId: booking._id },
      { $set: { endTime: newReturnDate, expiresAt: newReturnDate } }
    );

    // Record Payment
    await Payment.create({
      bookingId: booking._id,
      customerId: user.userId || (user as any).id,
      razorpayOrderId,
      razorpayPaymentId,
      amount: amount || 0,
      currency: 'INR',
      status: 'PAID',
      paymentMethod: 'ONLINE',
      transactionType: 'RENTAL_EXTENSION',
    });

    // Create Notification
    await Notification.create({
      userId: user.userId || (user as any).id,
      title: 'Rental Extension Confirmed',
      message: `Your booking #${booking.bookingNumber} has been extended to ${newReturnDate.toLocaleDateString('en-IN')}.`,
      type: 'BOOKING_UPDATED',
      data: { bookingId: booking._id.toString(), newReturnDateTime },
    });

    return NextResponse.json({
      success: true,
      bookingNumber: booking.bookingNumber,
      newReturnDateTime: newReturnDate.toISOString(),
      status: booking.bookingStatus,
      message: 'Rental extension successfully applied and paid.',
    });
  } catch (error: any) {
    console.error('Error verifying extension payment:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

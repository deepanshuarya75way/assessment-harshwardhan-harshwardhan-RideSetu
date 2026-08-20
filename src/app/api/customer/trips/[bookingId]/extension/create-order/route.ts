import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/models/Booking';
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
    const { amount, extensionDays, newReturnDateTime } = body;

    if (!amount || amount <= 0 || !newReturnDateTime) {
      return NextResponse.json({ error: 'Invalid extension order parameters' }, { status: 400 });
    }

    await connectToDatabase();

    let booking: any = null;
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await Booking.findById(bookingId).lean();
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingNumber: bookingId }).lean();
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.customerId.toString() !== (user.userId || (user as any).id) && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // Create Razorpay order for extension
    const razorpayOrder = await RazorpayService.createOrder({
      amount,
      currency: 'INR',
      receipt: `ext_${booking.bookingNumber}_${Date.now()}`,
      notes: {
        bookingId: booking._id.toString(),
        bookingNumber: booking.bookingNumber,
        newReturnDateTime,
        extensionDays: String(extensionDays || 1),
        type: 'RENTAL_EXTENSION',
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
      },
    });
  } catch (error: any) {
    console.error('Error creating extension order:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

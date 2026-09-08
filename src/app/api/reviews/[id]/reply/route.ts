import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { Vendor } from '@/models/Vendor';
import { Booking } from '@/models/Booking';
import { NotificationService } from '@/services/notification.service';
import { getSessionFromRequest, assertRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
    }

    const session = getSessionFromRequest(request);
    const authCheck = assertRole(session, ['VENDOR', 'ADMIN']);
    if (!authCheck.authorized || !session) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { replyText } = await request.json();
    if (!replyText || !replyText.trim()) {
      return NextResponse.json({ error: 'Reply text is required.' }, { status: 400 });
    }

    await connectToDatabase();
    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    }

    // Ownership check: Vendor can only reply to reviews for their own agency/fleet
    if (session.role === 'VENDOR') {
      const vendor = await Vendor.findOne({ userId: new mongoose.Types.ObjectId(session.userId) });
      if (!vendor || review.vendorId.toString() !== vendor._id.toString()) {
        return NextResponse.json({ error: 'Forbidden: You can only reply to reviews for your own vehicles.' }, { status: 403 });
      }
    }

    // Update vendor reply without touching customer ratings, comments, or verified status
    const isNew = !review.vendorReply || !review.vendorReply.text;
    review.vendorReply = {
      text: replyText.trim(),
      repliedAt: isNew ? new Date() : review.vendorReply?.repliedAt || new Date(),
      updatedAt: isNew ? undefined : new Date(),
      repliedBy: new mongoose.Types.ObjectId(session.userId),
    };

    await review.save();

    // Notify customer about vendor response
    const booking = await Booking.findById(review.bookingId).select('bookingNumber');
    const vendor = await Vendor.findById(review.vendorId).select('businessName');

    if (booking && vendor) {
      await NotificationService.sendVendorResponseAlert({
        customerUserId: review.customerId.toString(),
        bookingNumber: booking.bookingNumber,
        vendorName: vendor.businessName,
        bookingId: review.bookingId.toString(),
      });
    }

    return NextResponse.json({
      success: true,
      review,
      message: isNew ? 'Response published successfully!' : 'Response updated successfully!',
    });
  } catch (error: any) {
    console.error('[API Vendor Review Reply Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit response' }, { status: 500 });
  }
}

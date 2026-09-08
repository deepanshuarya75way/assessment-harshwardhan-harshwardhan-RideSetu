import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { Vehicle } from '@/models/Vehicle';
import { Vendor } from '@/models/Vendor';
import { AuditLog } from '@/models/AuditLog';
import { getSessionFromRequest, assertRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    const authCheck = assertRole(session, ['ADMIN']);
    if (!authCheck.authorized || !session) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    await connectToDatabase();
    const query: Record<string, unknown> = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const reviews = await Review.find(query)
      .populate('vehicleId', 'brand model registrationNumber')
      .populate('vendorId', 'businessName ownerName')
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('[API Admin Reviews GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    const authCheck = assertRole(session, ['ADMIN']);
    if (!authCheck.authorized || !session) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { reviewId, action, reason } = await request.json();
    if (!reviewId || !action) {
      return NextResponse.json({ error: 'Review ID and action are required.' }, { status: 400 });
    }

    if ((action === 'HIDE' || action === 'FLAG') && (!reason || !reason.trim())) {
      return NextResponse.json({ error: 'A specific reason is mandatory for hiding or flagging a review.' }, { status: 400 });
    }

    await connectToDatabase();
    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    }

    let newStatus = review.status;
    if (action === 'HIDE') newStatus = 'HIDDEN';
    if (action === 'RESTORE') newStatus = 'PUBLISHED';
    if (action === 'FLAG') newStatus = 'FLAGGED';

    review.status = newStatus;
    review.moderationReason = reason || '';
    review.moderatedAt = new Date();
    review.moderatedBy = new mongoose.Types.ObjectId(session.userId);
    await review.save();

    // Re-calculate Vehicle & Vendor ratings
    const vehicleReviews = await Review.find({ vehicleId: review.vehicleId, status: 'PUBLISHED' }).select('overallRating');
    const avgVehicleRating =
      vehicleReviews.length > 0
        ? vehicleReviews.reduce((acc, r) => acc + r.overallRating, 0) / vehicleReviews.length
        : 5.0;

    await Vehicle.findByIdAndUpdate(review.vehicleId, {
      rating: parseFloat(avgVehicleRating.toFixed(1)),
      totalReviews: vehicleReviews.length,
    });

    const vendorReviews = await Review.find({ vendorId: review.vendorId, status: 'PUBLISHED' }).select('overallRating');
    const avgVendorRating =
      vendorReviews.length > 0
        ? vendorReviews.reduce((acc, r) => acc + r.overallRating, 0) / vendorReviews.length
        : 5.0;

    await Vendor.findByIdAndUpdate(review.vendorId, {
      rating: parseFloat(avgVendorRating.toFixed(1)),
      totalReviews: vendorReviews.length,
    });

    // Create AuditLog
    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(session.userId),
      action: `REVIEW_${action}`,
      resource: 'Review',
      resourceId: review._id.toString(),
      details: {
        bookingId: review.bookingId?.toString(),
        oldStatus: review.status,
        newStatus,
        reason,
      },
    });

    return NextResponse.json({
      success: true,
      review,
      message: `Review marked as ${newStatus}.`,
    });
  } catch (error: any) {
    console.error('[API Admin Reviews PATCH Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to moderate review' }, { status: 500 });
  }
}

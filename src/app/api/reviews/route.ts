import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { Booking } from '@/models/Booking';
import { Vehicle } from '@/models/Vehicle';
import { Vendor } from '@/models/Vendor';
import { NotificationService } from '@/services/notification.service';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const vendorId = searchParams.get('vendorId');
    const aggregate = searchParams.get('aggregate') === 'true';

    await connectToDatabase();
    const query: Record<string, unknown> = {
      status: { $ne: 'HIDDEN' }, // Never show hidden reviews to public
    };
    if (vehicleId) query.vehicleId = new mongoose.Types.ObjectId(vehicleId);
    if (vendorId) query.vendorId = new mongoose.Types.ObjectId(vendorId);

    const reviews = await Review.find(query)
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    if (aggregate && reviews.length > 0) {
      const count = reviews.length;
      const avgOverall = reviews.reduce((sum, r) => sum + r.overallRating, 0) / count;
      const avgVehicle = reviews.reduce((sum, r) => sum + (r.vehicleConditionRating || r.overallRating), 0) / count;
      const avgVendor = reviews.reduce((sum, r) => sum + (r.vendorBehaviorRating || r.overallRating), 0) / count;
      const avgPickup = reviews.reduce((sum, r) => sum + (r.pickupExperienceRating || r.overallRating), 0) / count;
      const avgDelivery = reviews.reduce((sum, r) => sum + (r.deliveryExperienceRating || r.overallRating), 0) / count;

      return NextResponse.json({
        reviews,
        summary: {
          totalReviews: count,
          overallRating: parseFloat(avgOverall.toFixed(1)),
          vehicleConditionRating: parseFloat(avgVehicle.toFixed(1)),
          vendorBehaviorRating: parseFloat(avgVendor.toFixed(1)),
          pickupExperienceRating: parseFloat(avgPickup.toFixed(1)),
          deliveryExperienceRating: parseFloat(avgDelivery.toFixed(1)),
        },
      });
    }

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('[API Reviews GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      bookingId,
      overallRating,
      vehicleConditionRating,
      vendorBehaviorRating,
      pickupExperienceRating,
      deliveryExperienceRating,
      reviewText,
      photos = [],
    } = body;

    if (!bookingId || !overallRating || !reviewText) {
      return NextResponse.json({ error: 'Booking ID, rating, and review text are required.' }, { status: 400 });
    }

    // Strict 1-5 rating validation
    const numOverall = Number(overallRating);
    const numVehicle = Number(vehicleConditionRating || overallRating);
    const numVendor = Number(vendorBehaviorRating || overallRating);
    const numPickup = Number(pickupExperienceRating || overallRating);
    const numDelivery = Number(deliveryExperienceRating || overallRating);

    if (
      [numOverall, numVehicle, numVendor, numPickup, numDelivery].some(
        (val) => isNaN(val) || val < 1 || val > 5
      )
    ) {
      return NextResponse.json({ error: 'Rating values must be between 1 and 5.' }, { status: 400 });
    }

    await connectToDatabase();
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    if (booking.customerId.toString() !== session.userId) {
      return NextResponse.json({ error: 'You can only review your own bookings.' }, { status: 403 });
    }

    if (booking.bookingStatus !== 'COMPLETED') {
      return NextResponse.json({ error: 'Reviews can only be submitted for completed rentals.' }, { status: 400 });
    }

    const existingReview = await Review.findOne({ bookingId: booking._id });
    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this booking.' }, { status: 409 });
    }

    // Server derives verified ride status strictly from the completed booking relation
    const review = await Review.create({
      bookingId: booking._id,
      customerId: booking.customerId,
      customerName: session.name || 'Verified Rider',
      customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      vehicleId: booking.vehicleId,
      vendorId: booking.vendorId,
      overallRating: numOverall,
      vehicleConditionRating: numVehicle,
      vendorBehaviorRating: numVendor,
      pickupExperienceRating: numPickup,
      deliveryExperienceRating: numDelivery,
      reviewText: reviewText.trim(),
      photos: Array.isArray(photos) ? photos : [],
      status: 'PUBLISHED',
      isVerifiedRental: true, // Derived server-side
    });

    // Re-calculate Vehicle & Vendor ratings server-side
    const vehicleReviews = await Review.find({ vehicleId: booking.vehicleId, status: { $ne: 'HIDDEN' } }).select('overallRating');
    const avgVehicleRating =
      vehicleReviews.reduce((acc, r) => acc + r.overallRating, 0) / vehicleReviews.length;

    await Vehicle.findByIdAndUpdate(booking.vehicleId, {
      rating: parseFloat(avgVehicleRating.toFixed(1)),
      totalReviews: vehicleReviews.length,
    });

    const vendorReviews = await Review.find({ vendorId: booking.vendorId, status: { $ne: 'HIDDEN' } }).select('overallRating');
    const avgVendorRating =
      vendorReviews.reduce((acc, r) => acc + r.overallRating, 0) / vendorReviews.length;

    await Vendor.findByIdAndUpdate(booking.vendorId, {
      rating: parseFloat(avgVendorRating.toFixed(1)),
      totalReviews: vendorReviews.length,
    });

    // Notify vendor
    const vendor = await Vendor.findById(booking.vendorId).select('userId');
    const vehicle = await Vehicle.findById(booking.vehicleId).select('brand model');
    if (vendor && vehicle) {
      await NotificationService.sendNewReviewAlertToVendor({
        vendorUserId: vendor.userId.toString(),
        vehicleName: `${vehicle.brand} ${vehicle.model}`,
        rating: numOverall,
        customerName: session.name || 'A customer',
        bookingId: booking._id.toString(),
      });
    }

    return NextResponse.json({ success: true, review, message: 'Verified review submitted successfully!' });
  } catch (error: any) {
    console.error('[API Reviews POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit review' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vehicle } from '@/models/Vehicle';
import { Vendor } from '@/models/Vendor';
import { Destination } from '@/models/Destination';
import { Review } from '@/models/Review';
import { VehicleAvailability } from '@/models/VehicleAvailability';
import { Booking } from '@/models/Booking';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid vehicle ID format' }, { status: 400 });
    }

    await connectToDatabase();

    const vehicle = await Vehicle.findById(id)
      .populate('vendorId', 'businessName ownerName phone email address city rating totalReviews verificationStatus deliveryRadiusKm baseDeliveryFee isTopRated')
      .populate('destinationId', 'name slug state popularPickupLocations travelTips')
      .lean();

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const [reviews, activeBookings, blocks] = await Promise.all([
      Review.find({ vehicleId: vehicle._id }).sort({ createdAt: -1 }).limit(10).lean(),
      Booking.find({
        vehicleId: vehicle._id,
        bookingStatus: { $in: ['CONFIRMED', 'ACTIVE', 'PENDING'] },
        returnDateTime: { $gte: new Date() },
      }).select('pickupDateTime returnDateTime').lean(),
      VehicleAvailability.find({
        vehicleId: vehicle._id,
        endDate: { $gte: new Date() },
      }).select('startDate endDate reason').lean(),
    ]);

    const unavailableSlots = [
      ...activeBookings.map((b) => ({
        startDate: b.pickupDateTime,
        endDate: b.returnDateTime,
        reason: 'BOOKED',
      })),
      ...blocks.map((b) => ({
        startDate: b.startDate,
        endDate: b.endDate,
        reason: b.reason,
      })),
    ];

    return NextResponse.json({
      vehicle,
      reviews,
      unavailableSlots,
    });
  } catch (error: any) {
    console.error('[API Vehicle Details Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch vehicle details' }, { status: 500 });
  }
}

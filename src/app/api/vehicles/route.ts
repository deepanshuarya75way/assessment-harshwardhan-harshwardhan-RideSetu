import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vehicle } from '@/models/Vehicle';
import { Vendor } from '@/models/Vendor';
import { Destination } from '@/models/Destination';
import { Booking } from '@/models/Booking';
import { VehicleAvailability } from '@/models/VehicleAvailability';
import { ReservationLock } from '@/models/ReservationLock';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const destinationQuery = searchParams.get('destination');
    const categoryQuery = searchParams.get('category');
    const pickupDateTime = searchParams.get('pickupDateTime');
    const returnDateTime = searchParams.get('returnDateTime');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const transmission = searchParams.get('transmission');
    const fuelType = searchParams.get('fuelType');
    const minRating = searchParams.get('minRating');
    const maxDeposit = searchParams.get('maxDeposit');
    const deliveryAvailable = searchParams.get('delivery') || searchParams.get('doorstepDelivery');
    const hotelDelivery = searchParams.get('hotelDelivery');
    const hostelDelivery = searchParams.get('hostelDelivery');
    const helmet = searchParams.get('helmet');
    const verifiedOnly = searchParams.get('verifiedOnly');
    const sort = searchParams.get('sort') || 'recommended';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    await connectToDatabase();

    // Query only verified, active vendors
    const activeVendors = await Vendor.find({
      verificationStatus: 'VERIFIED',
      isActive: true,
    }).select('_id').lean();

    const verifiedVendorIds = activeVendors.map((v) => v._id);

    const query: Record<string, any> = {
      isAvailable: true,
      $or: [
        { status: 'APPROVED' },
        { status: { $exists: false }, isVerified: true },
      ],
      vendorId: { $in: verifiedVendorIds },
    };

    // Filter by Destination (by slug or ObjectId)
    if (destinationQuery) {
      if (mongoose.Types.ObjectId.isValid(destinationQuery)) {
        query.destinationId = new mongoose.Types.ObjectId(destinationQuery);
      } else {
        const dest = await Destination.findOne({ slug: destinationQuery.toLowerCase().trim() });
        if (dest) {
          query.destinationId = dest._id;
        }
      }
    }

    // Filter by Category
    if (categoryQuery && categoryQuery !== 'ALL') {
      const categories = categoryQuery.split(',').map((c) => c.trim().toUpperCase());
      query.category = { $in: categories };
    }

    // Filter by Price range
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
    }

    // Filter by Transmission
    if (transmission && transmission !== 'ALL') {
      query.transmission = transmission.toUpperCase();
    }

    // Filter by Fuel type
    if (fuelType && fuelType !== 'ALL') {
      query.fuelType = fuelType.toUpperCase();
    }

    // Filter by Rating
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    // Filter by Deposit
    if (maxDeposit) {
      query.securityDeposit = { $lte: Number(maxDeposit) };
    }

    // Filter by Delivery options
    if (deliveryAvailable === 'true') {
      query.deliveryAvailable = true;
    }
    if (hotelDelivery === 'true') {
      query.hotelDeliveryAvailable = true;
    }
    if (hostelDelivery === 'true') {
      query.hostelDeliveryAvailable = true;
    }
    if (helmet === 'true') {
      query.helmetIncluded = true;
    }

    // Date Availability Filtering
    if (pickupDateTime && returnDateTime) {
      const pickup = new Date(pickupDateTime);
      const returnDate = new Date(returnDateTime);

      if (!isNaN(pickup.getTime()) && !isNaN(returnDate.getTime()) && returnDate > pickup) {
        const user = await getAuthUser(request as any);
        const bookingFilter: Record<string, any> = {
          bookingStatus: { $in: ['CONFIRMED', 'ACTIVE', 'PENDING'] },
          pickupDateTime: { $lt: returnDate },
          returnDateTime: { $gt: pickup },
        };
        if (user?.userId) {
          bookingFilter.customerId = { $ne: new mongoose.Types.ObjectId(user.userId) };
        }

        // Find vehicle IDs with overlapping bookings
        const conflictingBookings = await Booking.find(bookingFilter).select('vehicleId').lean();

        // Find vehicle IDs with overlapping maintenance / manual blocks
        const conflictingBlocks = await VehicleAvailability.find({
          reason: { $in: ['BOOKED', 'MAINTENANCE', 'MANUAL_BLOCK', 'PERSONAL_USE'] },
          startDate: { $lt: returnDate },
          endDate: { $gt: pickup },
        }).select('vehicleId').lean();

        // Find vehicle IDs with active unexpired reservation locks held by OTHER users
        const lockFilter: Record<string, any> = {
          status: 'HOLD',
          expiresAt: { $gt: new Date() },
          pickupDateTime: { $lt: returnDate },
          returnDateTime: { $gt: pickup },
        };
        if (user?.userId) {
          lockFilter.userId = { $ne: new mongoose.Types.ObjectId(user.userId) };
        }

        const conflictingLocks = await ReservationLock.find(lockFilter).select('vehicleId').lean();

        const unavailableVehicleIds = new Set([
          ...conflictingBookings.map((b) => b.vehicleId.toString()),
          ...conflictingBlocks.map((b) => b.vehicleId.toString()),
          ...conflictingLocks.map((l) => l.vehicleId.toString()),
        ]);

        if (unavailableVehicleIds.size > 0) {
          query._id = { $nin: Array.from(unavailableVehicleIds).map((id) => new mongoose.Types.ObjectId(id)) };
        }
      }
    }

    // Sorting
    let sortOptions: Record<string, 1 | -1> = { rating: -1, totalBookings: -1 };
    if (sort === 'price_asc') sortOptions = { pricePerDay: 1 };
    else if (sort === 'price_desc') sortOptions = { pricePerDay: -1 };
    else if (sort === 'rating_desc') sortOptions = { rating: -1 };
    else if (sort === 'popular') sortOptions = { totalBookings: -1 };
    else if (sort === 'newest') sortOptions = { year: -1, createdAt: -1 };

    const skip = (page - 1) * limit;

    const [vehicles, totalCount] = await Promise.all([
      Vehicle.find(query)
        .populate('vendorId', 'businessName ownerName rating totalReviews verificationStatus deliveryRadiusKm baseDeliveryFee isTopRated')
        .populate('destinationId', 'name slug state')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Vehicle.countDocuments(query),
    ]);

    return NextResponse.json({
      vehicles,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('[API Vehicles Search Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to search vehicles' }, { status: 500 });
  }
}

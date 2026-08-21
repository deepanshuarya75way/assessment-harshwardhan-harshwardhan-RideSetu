import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vehicle } from '@/models/Vehicle';
import { Booking } from '@/models/Booking';
import { Payout } from '@/models/Payout';
import { Review } from '@/models/Review';
import { getSessionFromRequest, assertRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    const authCheck = assertRole(session, ['VENDOR', 'ADMIN']);
    if (!authCheck.authorized || !session) {
      return NextResponse.json({ error: authCheck.error || 'Unauthorized' }, { status: authCheck.status || 401 });
    }

    await connectToDatabase();
    const vId = session.vendorId && mongoose.Types.ObjectId.isValid(session.vendorId)
      ? new mongoose.Types.ObjectId(session.vendorId)
      : null;

    if (!vId) {
      // Look up vendor by userId
      const vendorObj = await mongoose.model('Vendor').findOne({ userId: new mongoose.Types.ObjectId(session.userId) });
      if (!vendorObj) {
        return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
      }
    }

    const vendorObjectId = vId || (await mongoose.model('Vendor').findOne({ userId: new mongoose.Types.ObjectId(session.userId) }))?._id;

    if (!vendorObjectId) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalVehicles,
      availableVehicles,
      maintenanceVehicles,
      inactiveVehicles,
      bookedVehicles,
      newBookingsToday,
      activeRentalsToday,
      returnsDueToday,
      deliveriesPendingToday,
      todaysPaidBookings,
      thisMonthsPaidBookings,
      allVendorPaidBookings,
      payouts,
      reviews,
    ] = await Promise.all([
      Vehicle.countDocuments({ vendorId: vendorObjectId }),
      Vehicle.countDocuments({ vendorId: vendorObjectId, isAvailable: true, status: 'APPROVED' }),
      Vehicle.countDocuments({ vendorId: vendorObjectId, status: 'MAINTENANCE' }),
      Vehicle.countDocuments({ vendorId: vendorObjectId, status: 'INACTIVE' }),
      Booking.countDocuments({ vendorId: vendorObjectId, bookingStatus: { $in: ['CONFIRMED', 'ACTIVE', 'OUT_FOR_DELIVERY', 'DELIVERY_ARRIVED', 'RENTAL_STARTED'] } }),
      Booking.countDocuments({ vendorId: vendorObjectId, createdAt: { $gte: startOfToday } }),
      Booking.countDocuments({ vendorId: vendorObjectId, bookingStatus: { $in: ['ACTIVE', 'RENTAL_STARTED'] } }),
      Booking.countDocuments({ vendorId: vendorObjectId, returnDateTime: { $gte: startOfToday, $lte: new Date(startOfToday.getTime() + 86400000) } }),
      Booking.countDocuments({ vendorId: vendorObjectId, pickupType: 'DOORSTEP_DELIVERY', bookingStatus: { $in: ['CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERY_ARRIVED'] } }),
      Booking.find({ vendorId: vendorObjectId, paymentStatus: 'PAID', createdAt: { $gte: startOfToday } }).select('totalPayable basePrice deliveryCharge').lean(),
      Booking.find({ vendorId: vendorObjectId, paymentStatus: 'PAID', createdAt: { $gte: startOfMonth } }).select('totalPayable basePrice deliveryCharge').lean(),
      Booking.find({ vendorId: vendorObjectId, paymentStatus: 'PAID' }).select('totalPayable basePrice deliveryCharge').lean(),
      Payout.find({ vendorId: vendorObjectId, status: 'PENDING' }).select('netAmount').lean(),
      Review.find({ vendorId: vendorObjectId }).select('overallRating').lean(),
    ]);

    const todaysRevenue = todaysPaidBookings.reduce((sum, b) => sum + (b.totalPayable || (b.basePrice + b.deliveryCharge) || 0), 0);
    const thisMonthsRevenue = thisMonthsPaidBookings.reduce((sum, b) => sum + (b.totalPayable || (b.basePrice + b.deliveryCharge) || 0), 0);
    const grossRevenue = allVendorPaidBookings.reduce((sum, b) => sum + (b.totalPayable || (b.basePrice + b.deliveryCharge) || 0), 0);
    const pendingPayoutsAmount = payouts.reduce((sum, p) => sum + (p.netAmount || 0), 0);
    const avgRating = reviews.length > 0
      ? parseFloat((reviews.reduce((acc, r) => acc + r.overallRating, 0) / reviews.length).toFixed(1))
      : 4.8;
    const utilizationRate = totalVehicles > 0 ? Math.round((bookedVehicles / totalVehicles) * 100) : 0;

    return NextResponse.json({
      metrics: {
        // Fleet Overview
        totalVehicles,
        availableVehicles,
        bookedVehicles,
        maintenanceVehicles,
        inactiveVehicles,
        // Today's Operations
        newBookingsToday,
        activeRentalsToday,
        returnsDueToday,
        deliveriesPendingToday,
        // Revenue Summary
        todaysRevenue,
        thisMonthsRevenue,
        grossRevenue,
        pendingPayoutsAmount,
        // Aggregates
        avgRating,
        totalReviews: reviews.length,
        utilizationRate,
      },
    });
  } catch (error: any) {
    console.error('[API Vendor Metrics GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch vendor metrics' }, { status: 500 });
  }
}

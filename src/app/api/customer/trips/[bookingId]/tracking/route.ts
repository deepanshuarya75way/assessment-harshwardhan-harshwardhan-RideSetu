import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/models/Booking';
import { TripLocation } from '@/models/TripLocation';
import { Vendor } from '@/models/Vendor';

export async function GET(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = params;
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    let booking: any = null;
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await Booking.findById(bookingId).populate('vendorId').lean();
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingNumber: bookingId }).populate('vendorId').lean();
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const uid = user.userId || (user as any).id;
    if (booking.customerId.toString() !== uid && user.role !== 'ADMIN' && booking.vendorId._id.toString() !== uid) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // Delivery eligibility check
    const isDeliveryType = booking.pickupType === 'DOORSTEP_DELIVERY' || booking.pickupType === 'HOSTEL_DELIVERY' || booking.deliveryLocation?.locationType === 'DOORSTEP' || booking.deliveryLocation?.locationType === 'HOTEL' || booking.deliveryLocation?.locationType === 'HOSTEL';
    
    // Status tracking eligibility
    const trackingStatuses = ['OUT_FOR_DELIVERY', 'READY_FOR_HANDOVER', 'PREPARING', 'HANDED_OVER', 'ACTIVE'];
    const isTrackingActive = trackingStatuses.includes(booking.bookingStatus);

    if (!isDeliveryType && !isTrackingActive) {
      return NextResponse.json({
        success: false,
        trackingAvailable: false,
        message: 'Live tracking is only available for active delivery orders.',
      });
    }

    // Get latest vendor coordinates from TripLocation or Vendor default location
    const latestLocation = await TripLocation.findOne({ bookingId: booking._id, role: 'VENDOR' })
      .sort({ timestamp: -1 })
      .lean();

    const vendor = booking.vendorId || {};
    const defaultVendorLat = vendor.location?.coordinates ? vendor.location.coordinates[1] : 30.1315;
    const defaultVendorLng = vendor.location?.coordinates ? vendor.location.coordinates[0] : 78.3242;

    const currentDriverLocation = {
      lat: latestLocation?.latitude || defaultVendorLat,
      lng: latestLocation?.longitude || defaultVendorLng,
      lastUpdated: latestLocation?.timestamp || booking.updatedAt || new Date(),
      speed: latestLocation?.speed || 0,
      heading: latestLocation?.heading || 0,
      deliveryState: latestLocation?.deliveryState || 'EN_ROUTE',
    };

    // Customer delivery location
    const customerLocation = {
      lat: booking.deliveryLocation?.latitude || 30.1385,
      lng: booking.deliveryLocation?.longitude || 78.3292,
      address: booking.deliveryLocation?.address || booking.pickupLocation || 'Customer Delivery Address',
    };

    // Simulated ETA calculation based on distance
    const distKm = Math.sqrt(
      Math.pow(currentDriverLocation.lat - customerLocation.lat, 2) +
      Math.pow(currentDriverLocation.lng - customerLocation.lng, 2)
    ) * 111; // Rough km estimate

    const etaMinutes = Math.max(5, Math.round(distKm * 3));

    return NextResponse.json({
      success: true,
      trackingAvailable: true,
      bookingNumber: booking.bookingNumber,
      bookingStatus: booking.bookingStatus,
      pickupType: booking.pickupType,
      driverName: vendor.businessName || 'RideSetu Delivery Executive',
      driverPhone: vendor.phone || '+91 9876543210',
      driverLocation: currentDriverLocation,
      customerLocation,
      etaMinutes,
      isDeliveryComplete: booking.bookingStatus === 'HANDED_OVER' || booking.bookingStatus === 'ACTIVE' || booking.bookingStatus === 'COMPLETED',
    });
  } catch (error: any) {
    console.error('Error fetching delivery tracking:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

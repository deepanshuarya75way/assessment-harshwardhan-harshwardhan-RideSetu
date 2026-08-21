import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/models/Booking';
import { TripLocation } from '@/models/TripLocation';
import { Notification } from '@/models/Notification';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || (user.role !== 'VENDOR' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized vendor access' }, { status: 403 });
    }

    const body = await req.json();
    const { bookingId, latitude, longitude, deliveryState, speed, heading } = body;

    if (!bookingId || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Booking ID and coordinates are required' }, { status: 400 });
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

    // Update Vendor Telemetry Record
    const locationRecord = await TripLocation.create({
      bookingId: booking._id,
      userId: user.userId || (user as any).id,
      role: 'VENDOR',
      latitude,
      longitude,
      accuracy: 5,
      speed: speed || 25,
      heading: heading || 90,
      timestamp: new Date(),
      deliveryState: deliveryState || 'EN_ROUTE',
    });

    // Update Booking status if transitioning to delivery or arrived
    if (deliveryState === 'EN_ROUTE' && booking.bookingStatus !== 'OUT_FOR_DELIVERY') {
      booking.bookingStatus = 'OUT_FOR_DELIVERY';
      await booking.save();

      await Notification.create({
        userId: booking.customerId,
        title: 'Vehicle Out for Delivery',
        message: `Vendor delivery partner is on the way with your vehicle for booking #${booking.bookingNumber}.`,
        type: 'DELIVERY_UPDATE',
        data: { bookingId: booking._id.toString() },
      });
    } else if (deliveryState === 'ARRIVED' && booking.bookingStatus !== 'READY_FOR_HANDOVER') {
      booking.bookingStatus = 'READY_FOR_HANDOVER';
      await booking.save();

      await Notification.create({
        userId: booking.customerId,
        title: 'Delivery Executive Arrived',
        message: `Delivery executive has arrived at your location with vehicle for booking #${booking.bookingNumber}.`,
        type: 'DELIVERY_UPDATE',
        data: { bookingId: booking._id.toString() },
      });
    }

    return NextResponse.json({
      success: true,
      bookingNumber: booking.bookingNumber,
      bookingStatus: booking.bookingStatus,
      location: {
        latitude: locationRecord.latitude,
        longitude: locationRecord.longitude,
        timestamp: locationRecord.timestamp,
      },
    });
  } catch (error: any) {
    console.error('Error updating vendor delivery coordinates:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

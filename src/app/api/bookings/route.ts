import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { BookingService } from '@/services/booking.service';
import { getSessionFromRequest, assertRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();

    const query: Record<string, unknown> = {};

    // Role-based Isolation
    if (session.role === 'CUSTOMER') {
      query.customerId = new mongoose.Types.ObjectId(session.userId);
    } else if (session.role === 'VENDOR') {
      if (!session.vendorId) {
        return NextResponse.json({ bookings: [] });
      }
      query.vendorId = new mongoose.Types.ObjectId(session.vendorId);
    }
    // ADMIN has full access without query filter

    const bookings = await Booking.find(query)
      .populate('vehicleId', 'brand model variant category images pricePerDay registrationNumber')
      .populate('vendorId', 'businessName ownerName phone email address')
      .populate('destinationId', 'name slug')
      .populate('handoverPickupId')
      .populate('handoverReturnId')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error('[API Bookings GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Please log in to complete your booking.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      vehicleId,
      pickupDateTime,
      returnDateTime,
      pickupType = 'VENDOR_PICKUP',
      pickupLocation,
      dropoffLocation,
      customerDetails,
      emergencyContact,
      deliveryLocation,
      couponCode,
      paymentMethod = 'UPI',
    } = body;

    if (!vehicleId || !pickupDateTime || !returnDateTime || !customerDetails?.drivingLicenseNumber) {
      return NextResponse.json(
        { error: 'Vehicle ID, dates, and driving license details are required.' },
        { status: 400 }
      );
    }

    const result = await BookingService.createBooking({
      customerId: session.userId,
      vehicleId,
      pickupDateTime,
      returnDateTime,
      pickupType,
      pickupLocation: pickupLocation || 'Tapovan Market Hub',
      dropoffLocation: dropoffLocation || pickupLocation || 'Tapovan Market Hub',
      customerDetails: {
        fullName: customerDetails.fullName || session.name,
        phone: customerDetails.phone || '+91 98765 43210',
        email: customerDetails.email || session.email,
        drivingLicenseNumber: customerDetails.drivingLicenseNumber,
      },
      emergencyContact,
      deliveryLocation,
      couponCode,
      paymentMethod,
    });

    return NextResponse.json({
      success: true,
      booking: result.booking,
      paymentOrderId: result.paymentOrderId,
      message: 'Booking confirmed successfully!',
    });
  } catch (error: any) {
    console.error('[API Bookings POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Booking failed.' }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/models/Booking';
import { GroupBooking } from '@/models/GroupBooking';
import { ReservationLock } from '@/models/ReservationLock';
import { PricingService } from '@/services/pricing.service';

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
    const { newReturnDate, newReturnTime } = body;

    if (!newReturnDate || !newReturnTime) {
      return NextResponse.json({ error: 'New return date and time are required' }, { status: 400 });
    }

    await connectToDatabase();

    let booking: any = null;
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await Booking.findById(bookingId).populate('vehicleId').lean();
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingNumber: bookingId }).populate('vehicleId').lean();
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Ownership Guard
    if (booking.customerId.toString() !== (user.userId || (user as any).id) && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // Status check
    const allowedStatuses = ['CONFIRMED', 'PREPARING', 'READY_FOR_HANDOVER', 'HANDED_OVER', 'ACTIVE'];
    if (!allowedStatuses.includes(booking.bookingStatus)) {
      return NextResponse.json({ error: `Cannot extend rental for status ${booking.bookingStatus}` }, { status: 400 });
    }

    const currentReturn = new Date(booking.returnDateTime);
    const proposedReturn = new Date(`${newReturnDate}T${newReturnTime}:00`);

    if (isNaN(proposedReturn.getTime())) {
      return NextResponse.json({ error: 'Invalid return date/time format' }, { status: 400 });
    }

    if (proposedReturn <= currentReturn) {
      return NextResponse.json({ error: 'New return time must be later than the current return time' }, { status: 400 });
    }

    // Check availability for single vehicle or group booking
    let vehicleIdsToCheck = [booking.vehicleId._id];
    let isGroup = false;

    if (booking.groupBookingId) {
      isGroup = true;
      const groupBookings = await Booking.find({ groupBookingId: booking.groupBookingId }).lean();
      vehicleIdsToCheck = groupBookings.map((gb: any) => gb.vehicleId);
    }

    // Availability Conflict Check: Exclude current booking ID(s)
    const currentBookingIds = isGroup
      ? (await Booking.find({ groupBookingId: booking.groupBookingId }).lean()).map((b: any) => b._id)
      : [booking._id];

    for (const vId of vehicleIdsToCheck) {
      const overlappingBooking = await Booking.findOne({
        _id: { $nin: currentBookingIds },
        vehicleId: vId,
        bookingStatus: { $in: ['CONFIRMED', 'PREPARING', 'READY_FOR_HANDOVER', 'HANDED_OVER', 'ACTIVE'] },
        pickupDateTime: { $lt: proposedReturn },
        returnDateTime: { $gt: currentReturn },
      }).lean();

      if (overlappingBooking) {
        return NextResponse.json({
          available: false,
          error: 'Vehicle is already booked for the requested extension period.',
          conflictVehicleId: vId.toString(),
        }, { status: 200 });
      }

      // Check ReservationLocks
      const activeLock = await ReservationLock.findOne({
        vehicleId: vId,
        status: 'ACTIVE',
        expiresAt: { $gt: new Date() },
        bookingId: { $nin: currentBookingIds },
        startTime: { $lt: proposedReturn },
        endTime: { $gt: currentReturn },
      }).lean();

      if (activeLock) {
        return NextResponse.json({
          available: false,
          error: 'Vehicle is reserved for another customer during the requested extension period.',
          conflictVehicleId: vId.toString(),
        }, { status: 200 });
      }
    }

    // Calculate extension pricing via PricingService
    const vehicle = booking.vehicleId;
    const additionalHours = Math.ceil((proposedReturn.getTime() - currentReturn.getTime()) / (3600 * 1000));
    const additionalDays = Math.ceil(additionalHours / 24);

    const pricePerDay = vehicle.pricePerDay || 499;
    const extensionRentalCharge = pricePerDay * additionalDays;
    const additionalPlatformFee = 49;
    const additionalTaxes = Math.round((extensionRentalCharge + additionalPlatformFee) * 0.18);
    const totalExtensionAmount = extensionRentalCharge + additionalPlatformFee + additionalTaxes;

    return NextResponse.json({
      success: true,
      available: true,
      extension: {
        currentReturnDateTime: currentReturn.toISOString(),
        newReturnDateTime: proposedReturn.toISOString(),
        additionalDays,
        additionalHours,
        extensionRentalCharge,
        additionalPlatformFee,
        additionalTaxes,
        totalExtensionAmount,
        currency: 'INR',
      },
    });
  } catch (error: any) {
    console.error('Error checking extension availability:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { Vehicle } from '@/models/Vehicle';
import { AvailabilityService } from '@/services/availability.service';
import { getSessionFromRequest } from '@/lib/auth';
import { calculateDurationDays } from '@/lib/utils';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { newReturnDateTime } = await request.json();
    if (!newReturnDateTime) {
      return NextResponse.json({ error: 'New return date & time required' }, { status: 400 });
    }

    await connectToDatabase();
    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const currentReturn = new Date(booking.returnDateTime);
    const requestedNewReturn = new Date(newReturnDateTime);

    if (requestedNewReturn <= currentReturn) {
      return NextResponse.json({ error: 'New return date must be later than current return date' }, { status: 400 });
    }

    // Check availability for extension interval (currentReturn -> requestedNewReturn)
    const availCheck = await AvailabilityService.isVehicleAvailable({
      vehicleId: booking.vehicleId,
      pickupDateTime: currentReturn,
      returnDateTime: requestedNewReturn,
      excludeBookingId: booking._id,
    });

    if (!availCheck.available) {
      return NextResponse.json({
        available: false,
        error: 'Sorry! The vehicle has another confirmed reservation during the requested extension period.',
      }, { status: 409 });
    }

    const vehicle = await Vehicle.findById(booking.vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    const additionalDays = calculateDurationDays(currentReturn, requestedNewReturn);
    const additionalBase = vehicle.pricePerDay * additionalDays;
    const additionalTax = Math.round(additionalBase * 0.18);
    const additionalTotal = additionalBase + additionalTax;

    booking.returnDateTime = requestedNewReturn;
    booking.rentalDurationDays += additionalDays;
    booking.basePrice += additionalBase;
    booking.taxes += additionalTax;
    booking.totalPayable += additionalTotal;
    await booking.save();

    return NextResponse.json({
      success: true,
      booking,
      additionalAmount: additionalTotal,
      message: `Rental successfully extended by ${additionalDays} day(s)!`,
    });
  } catch (error: any) {
    console.error('[API Booking Extend Error]:', error);
    return NextResponse.json({ error: error.message || 'Extension failed' }, { status: 500 });
  }
}

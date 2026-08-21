import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/models/Booking';
import { DigitalHandoverReport } from '@/models/DigitalHandoverReport';
import { Notification } from '@/models/Notification';

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || (user.role !== 'VENDOR' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized vendor access' }, { status: 403 });
    }

    const { bookingId } = params;
    const body = await req.json();
    const { odometerReading, fuelBatteryLevel, photos, helmetCount, remarks, accessoriesGiven } = body;

    if (!odometerReading || odometerReading <= 0) {
      return NextResponse.json({ error: 'Valid handover odometer reading is required' }, { status: 400 });
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

    // Create Handover Report
    const handoverReport = await DigitalHandoverReport.create({
      bookingId: booking._id,
      vehicleId: booking.vehicleId,
      handoverType: 'PICKUP',
      odometerReading,
      fuelBatteryLevel: fuelBatteryLevel || 100,
      existingScratches: [],
      photos: photos || {
        frontUrl: '/images/inspection/front.jpg',
        backUrl: '/images/inspection/back.jpg',
        leftUrl: '/images/inspection/left.jpg',
        rightUrl: '/images/inspection/right.jpg',
        meterUrl: '/images/inspection/meter.jpg',
      },
      helmetCount: helmetCount || 1,
      accessoriesGiven: accessoriesGiven || ['Helmet', 'Toolkit'],
      customerSignatureConfirmed: false,
      vendorAgentName: user.name || 'Vendor Representative',
      remarks: remarks || 'Pre-handover inspection complete',
      timestamp: new Date(),
    });

    booking.handoverPickupId = handoverReport._id;
    booking.bookingStatus = 'READY_FOR_HANDOVER';
    await booking.save();

    await Notification.create({
      userId: booking.customerId,
      title: 'Handover Inspection Complete',
      message: `Vendor completed handover inspection for booking #${booking.bookingNumber}. Please review and accept vehicle.`,
      type: 'BOOKING_UPDATED',
      data: { bookingId: booking._id.toString(), reportId: handoverReport._id.toString() },
    });

    return NextResponse.json({
      success: true,
      bookingNumber: booking.bookingNumber,
      status: booking.bookingStatus,
      reportId: handoverReport._id.toString(),
      message: 'Handover inspection recorded.',
    });
  } catch (error: any) {
    console.error('Error submitting handover inspection:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Customer Accepts Vehicle Handover -> Booking becomes ACTIVE
export async function PATCH(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = params;
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

    if (booking.customerId.toString() !== (user.userId || (user as any).id) && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    booking.bookingStatus = 'ACTIVE';
    booking.depositStatus = 'HELD';
    await booking.save();

    return NextResponse.json({
      success: true,
      bookingNumber: booking.bookingNumber,
      status: booking.bookingStatus,
      message: 'Vehicle handover accepted. Rental is now ACTIVE.',
    });
  } catch (error: any) {
    console.error('Error accepting handover:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

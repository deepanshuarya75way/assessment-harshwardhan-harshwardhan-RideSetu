import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/models/Booking';
import { GroupBooking } from '@/models/GroupBooking';
import { DigitalHandoverReport } from '@/models/DigitalHandoverReport';
import { DamageReport } from '@/models/DamageReport';

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
      booking = await Booking.findById(bookingId)
        .populate('vehicleId')
        .populate('vendorId')
        .lean();
    }

    if (!booking) {
      booking = await Booking.findOne({ bookingNumber: bookingId })
        .populate('vehicleId')
        .populate('vendorId')
        .lean();
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // RBAC & Ownership Security Guard
    if (booking.customerId.toString() !== (user.userId || (user as any).id) && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // Group booking info if applicable
    let groupBooking = null;
    let groupVehicles: any[] = [];
    if (booking.groupBookingId) {
      groupBooking = await GroupBooking.findOne({ groupId: booking.groupBookingId }).lean();
      const allGroupBookings = await Booking.find({ groupBookingId: booking.groupBookingId })
        .populate('vehicleId')
        .lean();
      
      groupVehicles = allGroupBookings.map((gb: any) => ({
        bookingId: gb._id.toString(),
        bookingNumber: gb.bookingNumber,
        vehicle: gb.vehicleId,
        riderDetails: gb.riderDetails,
        bookingStatus: gb.bookingStatus,
      }));
    }

    // Handover & Return Inspection reports if existing
    const handoverReport = await DigitalHandoverReport.findOne({ bookingId: booking._id, handoverType: 'PICKUP' }).lean();
    const returnReport = await DigitalHandoverReport.findOne({ bookingId: booking._id, handoverType: 'RETURN' }).lean();
    const damageReport = await DamageReport.findOne({ bookingId: booking._id }).lean();

    return NextResponse.json({
      success: true,
      trip: {
        id: booking._id.toString(),
        bookingNumber: booking.bookingNumber,
        groupBookingId: booking.groupBookingId || null,
        groupBooking,
        groupVehicles,
        vehicle: booking.vehicleId,
        vendor: booking.vendorId,
        pickupDateTime: booking.pickupDateTime,
        returnDateTime: booking.returnDateTime,
        pickupType: booking.pickupType,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        rentalDurationDays: booking.rentalDurationDays,
        rentalDurationHours: booking.rentalDurationHours,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        depositStatus: booking.depositStatus,
        riderDetails: booking.riderDetails || null,
        customerDetails: booking.customerDetails || null,
        deliveryLocation: booking.deliveryLocation || null,
        pricing: {
          basePrice: booking.basePrice,
          deliveryCharge: booking.deliveryCharge,
          platformFee: booking.platformFee,
          taxes: booking.taxes,
          securityDeposit: booking.securityDeposit,
          totalPayable: booking.totalPayable,
        },
        inspections: {
          handover: handoverReport || null,
          return: returnReport || null,
          damageReport: damageReport || null,
        },
        createdAt: booking.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching trip details:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/models/Booking';
import { Vehicle } from '@/models/Vehicle';
import { ReservationLock } from '@/models/ReservationLock';
import { DigitalHandoverReport } from '@/models/DigitalHandoverReport';
import { DamageReport } from '@/models/DamageReport';
import { Payout } from '@/models/Payout';
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
    const {
      returnOdometerReading,
      fuelBatteryLevel,
      photos,
      hasNewDamage,
      damageDescription,
      claimedDamageAmount,
      remarks,
    } = body;

    if (!returnOdometerReading || returnOdometerReading <= 0) {
      return NextResponse.json({ error: 'Valid return odometer reading is required' }, { status: 400 });
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

    // Handover Odometer Validation
    const pickupReport = await DigitalHandoverReport.findOne({ bookingId: booking._id, handoverType: 'PICKUP' }).lean();
    const handoverOdometer = pickupReport ? pickupReport.odometerReading : 0;

    if (returnOdometerReading < handoverOdometer) {
      return NextResponse.json({
        error: `Return odometer (${returnOdometerReading} km) cannot be less than handover odometer (${handoverOdometer} km)`,
      }, { status: 400 });
    }

    // Save Return Inspection Report
    const returnReport = await DigitalHandoverReport.create({
      bookingId: booking._id,
      vehicleId: booking.vehicleId,
      handoverType: 'RETURN',
      odometerReading: returnOdometerReading,
      fuelBatteryLevel: fuelBatteryLevel || 100,
      existingScratches: [],
      photos: photos || {
        frontUrl: '/images/inspection/return_front.jpg',
        backUrl: '/images/inspection/return_back.jpg',
        leftUrl: '/images/inspection/return_left.jpg',
        rightUrl: '/images/inspection/return_right.jpg',
        meterUrl: '/images/inspection/return_meter.jpg',
      },
      helmetCount: 1,
      accessoriesGiven: ['Helmet'],
      customerSignatureConfirmed: true,
      vendorAgentName: user.name || 'Vendor Representative',
      remarks: remarks || 'Return inspection complete',
      timestamp: new Date(),
    });

    booking.handoverReturnId = returnReport._id;

    if (hasNewDamage && claimedDamageAmount && claimedDamageAmount > 0) {
      // Create Damage Report & Mark Booking DISPUTED
      const damageRep = await DamageReport.create({
        bookingId: booking._id,
        vendorId: booking.vendorId,
        customerId: booking.customerId,
        beforePhotos: pickupReport?.photos ? Object.values(pickupReport.photos) : [],
        afterPhotos: photos ? Object.values(photos) : [],
        description: damageDescription || 'New damage reported during return inspection',
        claimedAmount: claimedDamageAmount,
        deductedAmount: 0,
        status: 'OPEN',
        vendorRemarks: remarks || '',
      });

      booking.bookingStatus = 'DISPUTED';
      booking.depositStatus = 'HELD';
      await booking.save();

      await Notification.create({
        userId: booking.customerId,
        title: 'Damage Reported on Return',
        message: `Vendor reported damage for booking #${booking.bookingNumber}. Deposit of ₹${booking.securityDeposit} is held under review.`,
        type: 'DISPUTE_RAISED',
        data: { bookingId: booking._id.toString(), damageReportId: damageRep._id.toString() },
      });

      return NextResponse.json({
        success: true,
        bookingNumber: booking.bookingNumber,
        status: booking.bookingStatus,
        depositStatus: booking.depositStatus,
        damageReportId: damageRep._id.toString(),
        message: 'Damage report created. Booking status marked DISPUTED.',
      });
    } else {
      // Zero Damage Flow -> Complete Booking & Refund Deposit
      booking.bookingStatus = 'COMPLETED';
      booking.depositStatus = 'REFUNDED';
      await booking.save();

      // Restore Vehicle Availability
      await Vehicle.findByIdAndUpdate(booking.vehicleId, { isAvailable: true, status: 'APPROVED' });

      // Release ReservationLocks
      await ReservationLock.updateMany({ bookingId: booking._id }, { $set: { status: 'RELEASED' } });

      // Record Vendor Payout Eligibility
      const vendorEarnings = Math.round(booking.basePrice * 0.85); // 85% payout share
      await Payout.create({
        vendorId: booking.vendorId,
        bookingId: booking._id,
        amount: vendorEarnings,
        currency: 'INR',
        status: 'ELIGIBLE',
        payoutMethod: 'BANK_TRANSFER',
      });

      // Send Customer Notification
      await Notification.create({
        userId: booking.customerId,
        title: 'Booking Completed & Deposit Refunded',
        message: `Booking #${booking.bookingNumber} completed smoothly. Security deposit of ₹${booking.securityDeposit} has been refunded.`,
        type: 'BOOKING_COMPLETED',
        data: { bookingId: booking._id.toString() },
      });

      return NextResponse.json({
        success: true,
        bookingNumber: booking.bookingNumber,
        status: booking.bookingStatus,
        depositStatus: booking.depositStatus,
        payoutEligible: true,
        payoutAmount: vendorEarnings,
        message: 'Return complete. Zero damage verified, deposit refunded, and vehicle restored to available fleet.',
      });
    }
  } catch (error: any) {
    console.error('Error processing return inspection:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { DamageReport } from '@/models/DamageReport';
import { Booking } from '@/models/Booking';
import { Vehicle } from '@/models/Vehicle';
import { ReservationLock } from '@/models/ReservationLock';
import { Notification } from '@/models/Notification';

export async function POST(
  req: NextRequest,
  { params }: { params: { disputeId: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    const { disputeId } = params;
    const body = await req.json();
    const { action, deductedAmount, adminNotes } = body; // APPROVE_DAMAGE, REJECT_DAMAGE

    if (!action || !['APPROVE_DAMAGE', 'REJECT_DAMAGE'].includes(action)) {
      return NextResponse.json({ error: 'Valid resolution action is required' }, { status: 400 });
    }

    await connectToDatabase();

    const damageReport = await DamageReport.findById(disputeId);
    if (!damageReport) {
      return NextResponse.json({ error: 'Dispute report not found' }, { status: 404 });
    }

    const booking = await Booking.findById(damageReport.bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Associated booking not found' }, { status: 404 });
    }

    if (action === 'APPROVE_DAMAGE') {
      const deduction = Math.min(deductedAmount || damageReport.claimedAmount, booking.securityDeposit);
      damageReport.status = 'RESOLVED';
      damageReport.deductedAmount = deduction;
      damageReport.adminNotes = adminNotes || 'Damage approved by Operations Console';
      damageReport.resolvedAt = new Date();
      await damageReport.save();

      booking.bookingStatus = 'COMPLETED';
      booking.depositStatus = deduction >= booking.securityDeposit ? 'PARTIALLY_DEDUCTED' : 'PARTIALLY_DEDUCTED';
      await booking.save();

      await Notification.create({
        userId: booking.customerId,
        title: 'Damage Dispute Resolved',
        message: `Admin resolved damage dispute for booking #${booking.bookingNumber}. ₹${deduction} deducted from deposit.`,
        type: 'DISPUTE_RESOLVED',
        data: { bookingId: booking._id.toString(), deduction },
      });
    } else {
      // REJECT_DAMAGE -> Full Deposit Refund
      damageReport.status = 'REJECTED';
      damageReport.deductedAmount = 0;
      damageReport.adminNotes = adminNotes || 'Damage claim rejected by Operations Console';
      damageReport.resolvedAt = new Date();
      await damageReport.save();

      booking.bookingStatus = 'COMPLETED';
      booking.depositStatus = 'REFUNDED';
      await booking.save();

      await Notification.create({
        userId: booking.customerId,
        title: 'Damage Dispute Resolved - Full Deposit Refund',
        message: `Damage claim for booking #${booking.bookingNumber} was rejected. Full deposit of ₹${booking.securityDeposit} refunded.`,
        type: 'DISPUTE_RESOLVED',
        data: { bookingId: booking._id.toString() },
      });
    }

    // Restore Vehicle Availability & Locks
    await Vehicle.findByIdAndUpdate(booking.vehicleId, { isAvailable: true, status: 'APPROVED' });
    await ReservationLock.updateMany({ bookingId: booking._id }, { $set: { status: 'RELEASED' } });

    return NextResponse.json({
      success: true,
      disputeId: damageReport._id.toString(),
      status: damageReport.status,
      bookingStatus: booking.bookingStatus,
      depositStatus: booking.depositStatus,
      message: `Dispute resolved cleanly with action: ${action}.`,
    });
  } catch (error: any) {
    console.error('Error resolving admin dispute:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

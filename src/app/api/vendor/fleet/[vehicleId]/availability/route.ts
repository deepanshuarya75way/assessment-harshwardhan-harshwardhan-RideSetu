import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vehicle } from '@/models/Vehicle';
import { Vendor } from '@/models/Vendor';
import { Booking } from '@/models/Booking';
import { ReservationLock } from '@/models/ReservationLock';
import { getSessionFromRequest, assertRole } from '@/lib/auth';
import { AuditLogService } from '@/services/audit.service';

export const dynamic = 'force-dynamic';

async function resolveVendorId(session: any): Promise<string | null> {
  if (session.vendorId && mongoose.Types.ObjectId.isValid(session.vendorId)) {
    return session.vendorId;
  }
  if (session.userId) {
    const vendor = await Vendor.findOne({ userId: new mongoose.Types.ObjectId(session.userId) });
    if (vendor) return vendor._id.toString();
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  try {
    const session = getSessionFromRequest(req);
    const auth = assertRole(session, ['VENDOR', 'ADMIN']);
    if (!auth.authorized || !session) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    await connectToDatabase();
    const vendorId = await resolveVendorId(session);
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const { vehicleId } = params;
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return NextResponse.json({ error: 'Invalid vehicle ID' }, { status: 400 });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Tenant Isolation
    if (vehicle.vendorId.toString() !== vendorId) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this vehicle' }, { status: 403 });
    }

    const body = await req.json();
    const targetAvailability = Boolean(body.isAvailable ?? body.available);
    const now = new Date();

    // Check for active rental or active reservation lock
    const activeBooking = await Booking.findOne({
      vehicleId: vehicle._id,
      bookingStatus: { $in: ['CONFIRMED', 'ACTIVE', 'OUT_FOR_DELIVERY', 'DELIVERY_ARRIVED', 'RENTAL_STARTED'] },
      pickupDateTime: { $lte: now },
      returnDateTime: { $gte: now },
    });

    const activeLock = await ReservationLock.findOne({
      vehicleId: vehicle._id,
      status: 'ACQUIRED',
      expiresAt: { $gt: now },
    });

    if ((activeBooking || activeLock) && targetAvailability) {
      return NextResponse.json(
        { error: 'Vehicle is currently rented or locked by an active customer booking. Manual availability override is rejected by server safety guard.' },
        { status: 400 }
      );
    }

    vehicle.isAvailable = targetAvailability;
    if (targetAvailability && vehicle.status === 'INACTIVE') {
      vehicle.status = 'APPROVED';
    } else if (!targetAvailability && vehicle.status === 'APPROVED') {
      vehicle.status = 'INACTIVE';
    }

    await vehicle.save();

    await AuditLogService.logVendorAction({
      vendorId,
      userId: session.userId,
      action: 'AVAILABILITY_CHANGED',
      entityId: vehicle._id.toString(),
      details: { isAvailable: vehicle.isAvailable, status: vehicle.status },
    });

    return NextResponse.json({
      success: true,
      vehicle,
      isAvailable: vehicle.isAvailable,
      message: `Vehicle availability set to ${vehicle.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}.`,
    });
  } catch (error: any) {
    console.error('[API Vendor Fleet Availability PATCH Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update vehicle availability' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vehicle } from '@/models/Vehicle';
import { Vendor } from '@/models/Vendor';
import { Booking } from '@/models/Booking';
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
    const enableMaintenance = Boolean(body.underMaintenance ?? body.maintenance ?? (body.status === 'MAINTENANCE'));

    if (enableMaintenance) {
      // Check for active rental trip
      const now = new Date();
      const activeBooking = await Booking.findOne({
        vehicleId: vehicle._id,
        bookingStatus: { $in: ['CONFIRMED', 'ACTIVE', 'OUT_FOR_DELIVERY', 'DELIVERY_ARRIVED', 'RENTAL_STARTED'] },
        returnDateTime: { $gte: now },
      });

      if (activeBooking) {
        return NextResponse.json(
          { error: 'Vehicle is currently on an active rental and cannot be placed under maintenance.' },
          { status: 400 }
        );
      }

      vehicle.status = 'MAINTENANCE';
      vehicle.isAvailable = false;

      await AuditLogService.logVendorAction({
        vendorId,
        userId: session.userId,
        action: 'MAINTENANCE_STARTED',
        entityId: vehicle._id.toString(),
        details: { reason: body.reason || 'Routine servicing' },
      });
    } else {
      // Release maintenance mode
      vehicle.status = 'APPROVED';
      vehicle.isAvailable = true;

      await AuditLogService.logVendorAction({
        vendorId,
        userId: session.userId,
        action: 'MAINTENANCE_COMPLETED',
        entityId: vehicle._id.toString(),
        details: { status: 'AVAILABLE' },
      });
    }

    await vehicle.save();

    return NextResponse.json({
      success: true,
      vehicle,
      status: vehicle.status,
      isAvailable: vehicle.isAvailable,
      message: enableMaintenance
        ? 'Vehicle placed under MAINTENANCE mode.'
        : 'Maintenance completed. Vehicle returned to AVAILABLE status.',
    });
  } catch (error: any) {
    console.error('[API Vendor Fleet Maintenance PATCH Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update vehicle maintenance mode' }, { status: 500 });
  }
}

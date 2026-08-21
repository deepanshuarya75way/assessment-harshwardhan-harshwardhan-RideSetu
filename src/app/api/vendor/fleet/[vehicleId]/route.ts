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

export async function GET(
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

    const vehicle = await Vehicle.findById(vehicleId).populate('destinationId', 'name slug');
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Strict Tenant Isolation Guard
    if (vehicle.vendorId.toString() !== vendorId) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this vehicle' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      vehicle,
    });
  } catch (error: any) {
    console.error('[API Vendor Fleet Single GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch vehicle' }, { status: 500 });
  }
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

    // Strict Tenant Isolation Guard
    if (vehicle.vendorId.toString() !== vendorId) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this vehicle' }, { status: 403 });
    }

    const body = await req.json();

    // Prevent mutating ownership
    delete body._id;
    delete body.vendorId;

    if (body.pricePerDay !== undefined) {
      const p = Number(body.pricePerDay);
      if (isNaN(p) || p <= 0) {
        return NextResponse.json({ error: 'Daily rate must be a valid number greater than 0.' }, { status: 400 });
      }
      vehicle.pricePerDay = p;
    }

    if (body.pricePerHour !== undefined) {
      const p = Number(body.pricePerHour);
      if (isNaN(p) || p <= 0) {
        return NextResponse.json({ error: 'Hourly rate must be a valid number greater than 0.' }, { status: 400 });
      }
      vehicle.pricePerHour = p;
    }

    if (body.securityDeposit !== undefined) {
      const s = Number(body.securityDeposit);
      if (isNaN(s) || s < 0) {
        return NextResponse.json({ error: 'Security deposit must be a valid non-negative number.' }, { status: 400 });
      }
      vehicle.securityDeposit = s;
      vehicle.securityDepositAmount = s;
      vehicle.securityDepositEnabled = s > 0;
    }

    if (body.brand) vehicle.brand = body.brand.trim();
    if (body.model) vehicle.model = body.model.trim();
    if (body.variant !== undefined) vehicle.variant = body.variant.trim();
    if (body.category) vehicle.category = body.category;
    if (body.color) vehicle.color = body.color.trim();
    if (body.registrationNumber) vehicle.registrationNumber = body.registrationNumber.trim().toUpperCase();
    if (body.description !== undefined) vehicle.description = body.description.trim();

    if (body.deliveryAvailable !== undefined) vehicle.deliveryAvailable = Boolean(body.deliveryAvailable);
    if (body.hotelDeliveryAvailable !== undefined) vehicle.hotelDeliveryAvailable = Boolean(body.hotelDeliveryAvailable);
    if (body.hostelDeliveryAvailable !== undefined) vehicle.hostelDeliveryAvailable = Boolean(body.hostelDeliveryAvailable);
    if (body.pickupAvailable !== undefined) vehicle.pickupAvailable = Boolean(body.pickupAvailable);
    if (body.helmetIncluded !== undefined) vehicle.helmetIncluded = Boolean(body.helmetIncluded);
    if (body.roadsideAssistance !== undefined) vehicle.roadsideAssistance = Boolean(body.roadsideAssistance);

    if (Array.isArray(body.images) && body.images.length > 0) vehicle.images = body.images;
    if (body.photos) vehicle.photos = { ...vehicle.photos, ...body.photos };
    if (body.specifications) vehicle.specifications = { ...vehicle.specifications, ...body.specifications };

    await vehicle.save();

    await AuditLogService.logVendorAction({
      vendorId,
      userId: session.userId,
      action: 'VEHICLE_UPDATED',
      entityId: vehicle._id.toString(),
      details: { brand: vehicle.brand, model: vehicle.model, pricePerDay: vehicle.pricePerDay },
    });

    return NextResponse.json({
      success: true,
      vehicle,
      message: 'Vehicle updated successfully.',
    });
  } catch (error: any) {
    console.error('[API Vendor Fleet Single PATCH Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update vehicle' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Strict Tenant Isolation Guard
    if (vehicle.vendorId.toString() !== vendorId) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this vehicle' }, { status: 403 });
    }

    // Historical Booking Deactivation Guard
    const hasHistoricalBookings = await Booking.exists({ vehicleId: vehicle._id });

    if (hasHistoricalBookings) {
      // Safely deactivate vehicle to preserve historical booking integrity
      vehicle.isAvailable = false;
      vehicle.status = 'INACTIVE';
      await vehicle.save();

      await AuditLogService.logVendorAction({
        vendorId,
        userId: session.userId,
        action: 'VEHICLE_DEACTIVATED',
        entityId: vehicle._id.toString(),
        details: { reason: 'Vehicle has historical bookings. Soft-deactivated to preserve records.' },
      });

      return NextResponse.json({
        success: true,
        deactivated: true,
        message: 'Vehicle has historical booking records and was safely DEACTIVATED instead of deleted.',
      });
    } else {
      // Hard delete only if zero historical bookings
      await Vehicle.findByIdAndDelete(vehicleId);

      await AuditLogService.logVendorAction({
        vendorId,
        userId: session.userId,
        action: 'VEHICLE_DEACTIVATED',
        entityId: vehicleId,
        details: { action: 'hard_deleted' },
      });

      return NextResponse.json({
        success: true,
        deleted: true,
        message: 'Vehicle deleted successfully.',
      });
    }
  } catch (error: any) {
    console.error('[API Vendor Fleet Single DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete or deactivate vehicle' }, { status: 500 });
  }
}

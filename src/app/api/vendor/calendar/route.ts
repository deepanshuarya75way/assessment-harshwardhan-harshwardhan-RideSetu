import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vehicle } from '@/models/Vehicle';
import { Vendor } from '@/models/Vendor';
import { VehicleAvailability } from '@/models/VehicleAvailability';
import { AvailabilityService } from '@/services/availability.service';
import { getSessionFromRequest, assertRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    const authCheck = assertRole(session, ['VENDOR', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');

    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 });
    }

    const schedule = await AvailabilityService.getVehicleSchedule(vehicleId);
    return NextResponse.json({ success: true, ...schedule });
  } catch (error: any) {
    console.error('[API Vendor Calendar GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    const authCheck = assertRole(session, ['VENDOR', 'ADMIN']);
    if (!authCheck.authorized || !session) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();

    const { vehicleId, startDate, endDate, reason = 'MANUAL_BLOCK', notes } = await request.json();

    if (!vehicleId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Vehicle ID and dates required' }, { status: 400 });
    }

    // RBAC: Verify vendor owns this vehicle
    if (session.role === 'VENDOR') {
      let vendorId = session.vendorId;
      if (!vendorId) {
        const v = await Vendor.findOne({ userId: session.userId });
        vendorId = v?._id.toString();
      }
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle || vehicle.vendorId.toString() !== vendorId) {
        return NextResponse.json({ error: 'Forbidden: You do not own this vehicle.' }, { status: 403 });
      }
    }

    try {
      const block = await AvailabilityService.blockDates({
        vehicleId,
        startDate,
        endDate,
        reason,
        notes,
      });

      return NextResponse.json({ success: true, block, message: 'Dates blocked successfully.' });
    } catch (blockErr: any) {
      // Conflict with confirmed bookings or existing blocks
      return NextResponse.json(
        {
          error: blockErr.message || 'Cannot block dates due to overlapping booking conflict.',
          conflict: true,
        },
        { status: 409 }
      );
    }
  } catch (error: any) {
    console.error('[API Vendor Calendar POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to block dates' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    const authCheck = assertRole(session, ['VENDOR', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { blockId } = await request.json();
    await connectToDatabase();
    await VehicleAvailability.findByIdAndDelete(blockId);

    return NextResponse.json({ success: true, message: 'Date block removed successfully.' });
  } catch (error: any) {
    console.error('[API Vendor Calendar DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove block' }, { status: 500 });
  }
}

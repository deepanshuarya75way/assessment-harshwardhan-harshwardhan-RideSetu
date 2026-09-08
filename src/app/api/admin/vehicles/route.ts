import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vehicle } from '@/models/Vehicle';
import { Vendor } from '@/models/Vendor';
import { AuditLog } from '@/models/AuditLog';
import { getSessionFromRequest, assertRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const auth = assertRole(session, ['ADMIN']);
    if (!auth.authorized || !session) {
      return NextResponse.json({ error: auth.error || 'Admin authorization required' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const query: Record<string, any> = {};
    if (statusFilter && statusFilter !== 'ALL') {
      query.status = statusFilter;
    }

    const vehicles = await Vehicle.find(query)
      .populate('vendorId', 'businessName ownerName phone email city verificationStatus rating')
      .populate('destinationId', 'name slug state')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      vehicles,
      count: vehicles.length,
    });
  } catch (error: any) {
    console.error('[API Admin Vehicles GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch vehicles' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const auth = assertRole(session, ['ADMIN']);
    if (!auth.authorized || !session) {
      return NextResponse.json({ error: auth.error || 'Admin authorization required' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await req.json();
    const { vehicleId, action, reason = '' } = body;

    if (!vehicleId || !action) {
      return NextResponse.json({ error: 'Vehicle ID and action are required.' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return NextResponse.json({ error: 'Invalid Vehicle ID format' }, { status: 400 });
    }

    const vehicle = await Vehicle.findById(vehicleId).populate('vendorId', 'businessName');
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const prevStatus = vehicle.status;

    if (action === 'APPROVE') {
      vehicle.status = 'APPROVED';
      vehicle.isVerified = true;
      vehicle.isAvailable = true;
      vehicle.rejectionReason = '';
      vehicle.reviewedAt = new Date();
      vehicle.reviewedBy = new mongoose.Types.ObjectId(session.userId);
    } else if (action === 'REJECT') {
      if (!reason || reason.trim().length === 0) {
        return NextResponse.json({ error: 'A valid rejection reason is mandatory when rejecting a vehicle.' }, { status: 400 });
      }
      vehicle.status = 'REJECTED';
      vehicle.isVerified = false;
      vehicle.rejectionReason = reason;
      vehicle.reviewedAt = new Date();
      vehicle.reviewedBy = new mongoose.Types.ObjectId(session.userId);
    } else if (action === 'SUSPEND') {
      vehicle.status = 'SUSPENDED';
      vehicle.isAvailable = false;
      vehicle.rejectionReason = reason || 'Suspended by admin';
      vehicle.reviewedAt = new Date();
      vehicle.reviewedBy = new mongoose.Types.ObjectId(session.userId);
    } else if (action === 'MAINTENANCE') {
      vehicle.status = 'MAINTENANCE';
      vehicle.isAvailable = false;
      vehicle.reviewedAt = new Date();
      vehicle.reviewedBy = new mongoose.Types.ObjectId(session.userId);
    } else {
      return NextResponse.json({ error: `Invalid action "${action}".` }, { status: 400 });
    }

    await vehicle.save();

    // Create Audit Log
    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(session.userId),
      action: `VEHICLE_${action}`,
      resourceType: 'VEHICLE',
      resourceId: vehicle._id.toString(),
      metadata: {
        registrationNumber: vehicle.registrationNumber,
        brand: vehicle.brand,
        model: vehicle.model,
        prevStatus,
        newStatus: vehicle.status,
        reason,
        adminEmail: session.email,
      },
    });

    return NextResponse.json({
      success: true,
      vehicle,
      message: `Vehicle ${action.toLowerCase()}d successfully.`,
    });
  } catch (error: any) {
    console.error('[API Admin Vehicles PATCH Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update vehicle' }, { status: 500 });
  }
}

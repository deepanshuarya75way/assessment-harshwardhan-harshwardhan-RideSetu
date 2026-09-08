import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, getServerSession } from '@/lib/auth';
import GroupBooking from '@/models/GroupBooking';
import connectToDatabase from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req) || (await getServerSession());
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    await connectToDatabase();
    const groups = await GroupBooking.find({
      'vehicles.rider.drivingLicenseNumber': { $exists: true, $ne: '' },
    })
      .populate('customerId', 'name email phone')
      .populate('vehicles.vehicleId', 'brand model registrationNumber category')
      .lean();

    const riderList: any[] = [];
    for (const g of groups as any[]) {
      for (const v of g.vehicles) {
        if (v.rider && v.rider.drivingLicenseNumber) {
          riderList.push({
            groupBookingId: g.groupBookingId,
            customerId: g.customerId,
            vehicle: v.vehicleId,
            rider: v.rider,
            createdAt: g.createdAt,
          });
        }
      }
    }

    return NextResponse.json({ success: true, count: riderList.length, riders: riderList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req) || (await getServerSession());
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { groupBookingId, vehicleId, action, rejectionReason } = body;

    if (!groupBookingId || !vehicleId || !action) {
      return NextResponse.json(
        { error: 'groupBookingId, vehicleId, and action are required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const group = await GroupBooking.findOne({ groupBookingId });
    if (!group) {
      return NextResponse.json({ error: 'Group booking not found' }, { status: 404 });
    }

    const item = group.vehicles.find(
      (v) => v.vehicleId.toString() === vehicleId.toString()
    );

    if (!item) {
      return NextResponse.json({ error: 'Vehicle not found in group booking' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      item.rider.verificationStatus = 'VERIFIED';
      item.rider.verifiedAt = new Date();
      item.rider.rejectionReason = '';
    } else if (action === 'REJECT') {
      item.rider.verificationStatus = 'REJECTED';
      item.rider.rejectionReason = rejectionReason || 'Driving license verification rejected by admin.';
    } else if (action === 'REQUEST_CHANGES') {
      item.rider.verificationStatus = 'UNDER_REVIEW';
      item.rider.rejectionReason = rejectionReason || 'Please re-upload a clear driving license copy.';
    }

    const allVerified = group.vehicles.every((v) => v.rider.verificationStatus === 'VERIFIED');
    group.bookingStatus = allVerified ? 'VERIFIED' : 'PENDING_VERIFICATION';

    await group.save();
    return NextResponse.json({ success: true, group });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

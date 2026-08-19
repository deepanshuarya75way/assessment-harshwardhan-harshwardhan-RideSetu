import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, getServerSession } from '@/lib/auth';
import { GroupBookingService } from '@/services/group-booking.service';
import GroupBooking from '@/models/GroupBooking';
import connectToDatabase from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req) || (await getServerSession());
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ success: true, group: null });
    }

    const group = await GroupBooking.findOne({
      customerId: session.userId,
      bookingStatus: { $ne: 'CANCELLED' },
    })
      .populate('vehicles.vehicleId')
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, group });
  } catch (error: any) {
    console.error('[API Group Bookings GET Error]:', error);
    return NextResponse.json({ success: true, group: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req) || (await getServerSession());
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { vehicleId, pickupDateTime, returnDateTime, pickupType, pickupLocation, dropoffLocation, groupId, deliveryLocation } = body;

    if (!vehicleId || !pickupDateTime || !returnDateTime) {
      return NextResponse.json(
        { success: false, error: 'vehicleId, pickupDateTime, and returnDateTime are required.' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    if (!db) {
      // Mock group response if database unavailable
      const mockGroupId = groupId || `RS-GROUP-${Date.now().toString().slice(-6)}`;
      return NextResponse.json({
        success: true,
        group: {
          groupId: mockGroupId,
          customerId: session.userId,
          vehicles: [
            {
              vehicleId,
              pickupDateTime,
              returnDateTime,
              pickupType: pickupType || 'VENDOR_PICKUP',
              pickupLocation: pickupLocation || 'Vendor Hub',
              dropoffLocation: dropoffLocation || 'Vendor Hub',
              deliveryLocation,
              pricing: { basePrice: 499, totalPayable: 499 },
            },
          ],
          totalAmount: 499,
          bookingStatus: 'DRAFT',
        },
      });
    }

    const group = await GroupBookingService.addVehicleToGroup({
      groupId,
      customerId: session.userId,
      vehicleId,
      pickupDateTime,
      returnDateTime,
      pickupType: pickupType || 'VENDOR_PICKUP',
      pickupLocation: pickupLocation || 'Dehradun City Hub',
      dropoffLocation: dropoffLocation || 'Dehradun City Hub',
      deliveryLocation,
    });

    return NextResponse.json({ success: true, group });
  } catch (error: any) {
    console.error('[API Group Bookings POST Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update group booking' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req) || (await getServerSession());
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    const vehicleId = searchParams.get('vehicleId');

    if (!groupId || !vehicleId) {
      return NextResponse.json({ success: false, error: 'groupId and vehicleId are required.' }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ success: true, group: null });
    }

    const group = await GroupBookingService.removeVehicleFromGroup(groupId, session.userId, vehicleId);
    return NextResponse.json({ success: true, group });
  } catch (error: any) {
    console.error('[API Group Bookings DELETE Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to remove vehicle' }, { status: 400 });
  }
}

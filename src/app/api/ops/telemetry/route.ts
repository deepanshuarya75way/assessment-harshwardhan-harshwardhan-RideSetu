import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { TripLocation } from '@/models/TripLocation';
import { Destination } from '@/models/Destination';
import { getSessionFromRequest, assertRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const auth = assertRole(session, ['ADMIN']);
    if (!auth.authorized || !session) {
      return NextResponse.json({ error: auth.error || 'Admin authorization required' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'ALL';
    const queryTerm = searchParams.get('query') || '';

    // Fetch active bookings
    const activeBookings = await Booking.find({
      bookingStatus: { $in: ['CONFIRMED', 'PRE_PICKUP', 'READY_FOR_HANDOVER', 'HANDED_OVER', 'ACTIVE', 'RETURN_PENDING'] },
    })
      .populate('customerId', 'name phone')
      .populate('vendorId', 'businessName phone')
      .populate('vehicleId', 'brand model registrationNumber')
      .lean();

    // Fetch latest location for each active booking
    const telemetryData = await Promise.all(
      activeBookings.map(async (b: any) => {
        const latestLocation = await TripLocation.findOne({ bookingId: b._id })
          .sort({ timestamp: -1 })
          .lean();

        let status: 'LIVE' | 'STALE' | 'OFFLINE' = 'OFFLINE';
        if (latestLocation) {
          const secondsAgo = Math.floor((Date.now() - new Date(latestLocation.timestamp).getTime()) / 1000);
          if (secondsAgo <= 15) status = 'LIVE';
          else if (secondsAgo <= 120) status = 'STALE';
          else status = 'OFFLINE';
        }

        return {
          bookingId: b._id,
          bookingNumber: b.bookingNumber,
          customerName: b.customerId?.name || 'Customer',
          vendorName: b.vendorId?.businessName || 'Vendor',
          vehicleName: `${b.vehicleId?.brand || ''} ${b.vehicleId?.model || ''}`.trim(),
          registrationNumber: b.vehicleId?.registrationNumber || '',
          bookingStatus: b.bookingStatus,
          deliveryState: latestLocation?.deliveryState || 'EN_ROUTE',
          latestLocation,
          telemetryStatus: status,
          deliveryLocation: b.deliveryLocation,
        };
      })
    );

    // Fetch Hub destinations
    const hubs = await Destination.find({ isActive: true }).select('name latitude longitude category slug').lean();

    // Filter telemetry
    let filteredTelemetry = telemetryData;
    if (filter === 'ACTIVE') {
      filteredTelemetry = telemetryData.filter((t) => t.bookingStatus === 'ACTIVE');
    } else if (filter === 'EN_ROUTE') {
      filteredTelemetry = telemetryData.filter((t) => t.deliveryState === 'EN_ROUTE');
    } else if (filter === 'NEAR_DESTINATION') {
      filteredTelemetry = telemetryData.filter((t) => t.deliveryState === 'NEAR_DESTINATION');
    } else if (filter === 'ARRIVED') {
      filteredTelemetry = telemetryData.filter((t) => t.deliveryState === 'ARRIVED');
    }

    if (queryTerm.trim()) {
      const q = queryTerm.trim().toLowerCase();
      filteredTelemetry = filteredTelemetry.filter(
        (t) =>
          t.bookingNumber.toLowerCase().includes(q) ||
          t.registrationNumber.toLowerCase().includes(q) ||
          t.vendorName.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      telemetry: filteredTelemetry,
      hubs,
      totalActiveCount: telemetryData.length,
    });
  } catch (error: any) {
    console.error('[API Ops Telemetry GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch ops telemetry' }, { status: 500 });
  }
}

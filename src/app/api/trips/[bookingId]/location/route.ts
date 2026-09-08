import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { TripLocation } from '@/models/TripLocation';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Haversine distance calculation in meters
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { bookingId } = params;
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID format' }, { status: 400 });
    }

    await connectToDatabase();
    const bObjectId = new mongoose.Types.ObjectId(bookingId);

    const booking = await Booking.findById(bObjectId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Role Ownership Validation
    const isCustomer = session.userId === booking.customerId.toString();
    const isVendor = session.vendorId
      ? session.vendorId === booking.vendorId.toString()
      : session.role === 'VENDOR';
    const isAdmin = session.role === 'ADMIN';

    if (!isCustomer && !isVendor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this trip telemetry' }, { status: 403 });
    }

    const body = await request.json();
    const {
      latitude,
      longitude,
      accuracy = 10,
      heading = 0,
      speed = 0,
      deliveryState,
      isMock = false,
      timestamp,
    } = body;

    // Strict GPS Coordinates & Accuracy Validation
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinates. Latitude must be between -90 and 90, Longitude -180 to 180.' },
        { status: 400 }
      );
    }

    if (typeof accuracy !== 'number' || accuracy < 0) {
      return NextResponse.json({ error: 'Invalid accuracy value' }, { status: 400 });
    }

    if (speed < 0 || speed > 250) {
      return NextResponse.json({ error: 'Unreasonable speed telemetry value rejected' }, { status: 400 });
    }

    // Server-Side Throttling Check (20m / 5s default)
    const minDistanceMeters = Number(process.env.LOCATION_UPDATE_MIN_DISTANCE_METERS) || 20;
    const minIntervalMs = Number(process.env.LOCATION_UPDATE_MIN_INTERVAL_MS) || 5000;

    const latestLocation = await TripLocation.findOne({ bookingId: bObjectId })
      .sort({ timestamp: -1 })
      .lean();

    if (latestLocation) {
      const timeDiffMs = Date.now() - new Date(latestLocation.timestamp).getTime();
      const distMeters = calculateHaversineDistance(
        latestLocation.latitude,
        latestLocation.longitude,
        latitude,
        longitude
      );

      // Throttling: If updated within minIntervalMs AND moved less than minDistanceMeters, throttle update
      if (timeDiffMs < minIntervalMs && distMeters < minDistanceMeters && !deliveryState) {
        return NextResponse.json({
          success: true,
          throttled: true,
          message: `Location update throttled (${Math.round(distMeters)}m / ${Math.round(timeDiffMs/1000)}s)`,
          latest: latestLocation,
        });
      }
    }

    // Proximity Detection to Destination (if destination coordinates available in deliveryLocation)
    let nearDestination = false;
    let distanceToDestinationMeters = 0;

    if (booking.deliveryLocation?.latitude && booking.deliveryLocation?.longitude) {
      distanceToDestinationMeters = calculateHaversineDistance(
        latitude,
        longitude,
        booking.deliveryLocation.latitude,
        booking.deliveryLocation.longitude
      );
      if (distanceToDestinationMeters <= 100) {
        nearDestination = true;
      }
    }

    // Server-side State Machine Validation for Delivery States
    let resolvedState = deliveryState || latestLocation?.deliveryState || 'EN_ROUTE';

    if (deliveryState === 'ARRIVED') {
      // Arrived Validation: Ensure vendor is within 100 meters (or allow admin override)
      if (!nearDestination && distanceToDestinationMeters > 200 && !isAdmin) {
        return NextResponse.json(
          {
            error: `Arrival validation failed. You are currently ${Math.round(
              distanceToDestinationMeters
            )}m away from destination (must be within 100m).`,
            distanceMeters: Math.round(distanceToDestinationMeters),
          },
          { status: 400 }
        );
      }
    } else if (nearDestination && resolvedState === 'EN_ROUTE') {
      resolvedState = 'NEAR_DESTINATION';
    }

    const newLocation = await TripLocation.create({
      bookingId: bObjectId,
      userId: new mongoose.Types.ObjectId(session.userId),
      role: session.role === 'VENDOR' ? 'VENDOR' : 'CUSTOMER',
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
      deliveryState: resolvedState,
      isMock: Boolean(isMock),
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    return NextResponse.json({
      success: true,
      location: newLocation,
      nearDestination,
      distanceToDestinationMeters: Math.round(distanceToDestinationMeters),
    });
  } catch (error: any) {
    console.error('[API Trip Location POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to record location update' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { bookingId } = params;
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID format' }, { status: 400 });
    }

    await connectToDatabase();
    const bObjectId = new mongoose.Types.ObjectId(bookingId);

    const booking = await Booking.findById(bObjectId).populate('vendorId', 'businessName phone');
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Role Ownership Validation
    const isCustomer = session.userId === booking.customerId.toString();
    const isVendor = session.vendorId
      ? session.vendorId === booking.vendorId.toString()
      : session.role === 'VENDOR';
    const isAdmin = session.role === 'ADMIN';

    if (!isCustomer && !isVendor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this trip telemetry' }, { status: 403 });
    }

    const latestLocation = await TripLocation.findOne({ bookingId: bObjectId })
      .sort({ timestamp: -1 })
      .lean();

    // Determine Stale & Offline Status
    let status: 'LIVE' | 'STALE' | 'OFFLINE' = 'OFFLINE';
    let secondsAgo = -1;

    if (latestLocation) {
      secondsAgo = Math.floor((Date.now() - new Date(latestLocation.timestamp).getTime()) / 1000);
      if (secondsAgo <= 15) {
        status = 'LIVE';
      } else if (secondsAgo <= 120) {
        status = 'STALE';
      } else {
        status = 'OFFLINE';
      }
    }

    // Calculate Distance & Route ETA if pickup and delivery coordinates exist
    let distanceKm = 0;
    let etaMinutes = 0;

    if (latestLocation && booking.deliveryLocation?.latitude && booking.deliveryLocation?.longitude) {
      const distMeters = calculateHaversineDistance(
        latestLocation.latitude,
        latestLocation.longitude,
        booking.deliveryLocation.latitude,
        booking.deliveryLocation.longitude
      );
      distanceKm = Number((distMeters / 1000).toFixed(1));
      // Estimate 25 km/h avg speed in hill road conditions
      etaMinutes = Math.max(1, Math.round((distanceKm / 25) * 60));
    }

    return NextResponse.json({
      success: true,
      bookingNumber: booking.bookingNumber,
      bookingStatus: booking.bookingStatus,
      deliveryLocation: booking.deliveryLocation,
      latestLocation,
      telemetryStatus: status,
      secondsAgo,
      distanceKm,
      etaMinutes,
      trackingSource: latestLocation?.isMock ? 'MOCK_LOCATION' : 'REAL_GPS',
    });
  } catch (error: any) {
    console.error('[API Trip Location GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch trip location' }, { status: 500 });
  }
}

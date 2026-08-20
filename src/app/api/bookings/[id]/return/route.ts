import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { HandoverService } from '@/services/handover.service';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid booking ID format' }, { status: 400 });
    }

    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });
    }

    if (session.role !== 'VENDOR' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You are not authorized to record vendor return inspections.' }, { status: 403 });
    }

    const body = await request.json();
    const odometer = body.returnOdometerReading ?? body.odometerReading;
    const fuel = body.returnFuelBatteryLevel ?? body.fuelBatteryLevel;
    const scratches = body.returnScratches ?? body.existingScratches ?? [];
    const photos = body.returnPhotos ?? body.photos ?? {};
    const {
      vehicleId,
      vendorAgentName,
      damageDescription = '',
      remarks = '',
    } = body;

    // Required fields check
    const missing: string[] = [];
    if (!vehicleId) missing.push('Vehicle ID');
    if (odometer === undefined || odometer === null || isNaN(Number(odometer))) missing.push('Return odometer reading');
    if (fuel === undefined || fuel === null || isNaN(Number(fuel))) missing.push('Return fuel level');

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Return inspection cannot be submitted. Missing: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const { report, isDisputed } = await HandoverService.recordVendorReturn({
      bookingId: id,
      vendorUserId: session.userId,
      vehicleId,
      returnOdometerReading: Number(odometer),
      returnFuelBatteryLevel: Number(fuel),
      returnScratches: scratches,
      returnPhotos: {
        frontUrl: photos.frontUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
        backUrl: photos.backUrl || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
        leftUrl: photos.leftUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
        rightUrl: photos.rightUrl || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
        meterUrl: photos.meterUrl || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
        dashboardUrl: photos.dashboardUrl || '',
      },
      vendorAgentName: vendorAgentName || session.name,
      damageDescription,
      remarks,
    });

    return NextResponse.json({
      success: true,
      report,
      isDisputed,
      message: isDisputed
        ? 'Potential damage detected. Your return inspection has been submitted for RideSetu review.'
        : 'Return inspection completed successfully. Booking marked COMPLETED & deposit released.',
    });
  } catch (error: any) {
    console.error('[API Return Inspection POST Error]:', error);
    const status = error.message?.includes('Forbidden')
      ? 403
      : error.message?.includes('lower than') || error.message?.includes('Missing') || error.message?.includes('must be') || error.message?.includes('unavailable')
      ? 400
      : error.message?.includes('status') || error.message?.includes('transition')
      ? 409
      : 500;
    return NextResponse.json({ error: error.message || 'Return inspection could not be saved. Please try again.' }, { status });
  }
}

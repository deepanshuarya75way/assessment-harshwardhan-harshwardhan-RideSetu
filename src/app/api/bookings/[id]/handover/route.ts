import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { HandoverService } from '@/services/handover.service';
import { Booking } from '@/models/Booking';
import { Vendor } from '@/models/Vendor';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(
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

    await connectToDatabase();

    const booking = await Booking.findById(id).populate('vehicleId destinationId vendorId');
    if (!booking) {
      return NextResponse.json({ error: 'Booking or vehicle could not be found.' }, { status: 404 });
    }

    // RBAC: Verify ownership
    if (session.role === 'VENDOR') {
      let vendorId = session.vendorId;
      if (!vendorId) {
        const v = await Vendor.findOne({ userId: session.userId });
        vendorId = v?._id.toString();
      }
      if (booking.vendorId._id.toString() !== vendorId) {
        return NextResponse.json({ error: 'You are not authorized to inspect this booking.' }, { status: 403 });
      }
    } else if (session.role === 'CUSTOMER') {
      if (booking.customerId.toString() !== session.userId) {
        return NextResponse.json({ error: 'You are not authorized to inspect this booking.' }, { status: 403 });
      }
    }

    const comparison = await HandoverService.getHandoverComparison(id);

    // Sanitize sensitive customer KYC info from response object
    const sanitizedBooking = booking.toObject();
    if (session.role === 'VENDOR') {
      if (sanitizedBooking.customerDetails) {
        delete (sanitizedBooking.customerDetails as any).drivingLicenseNumber;
        delete (sanitizedBooking.customerDetails as any).aadhaarNumber;
        delete (sanitizedBooking.customerDetails as any).kycDocUrl;
        // Mask phone for vendor privacy
        if (sanitizedBooking.customerDetails.phone) {
          const ph = sanitizedBooking.customerDetails.phone;
          sanitizedBooking.customerDetails.phone = `${ph.slice(0, 3)}*****${ph.slice(-2)}`;
        }
      }
    }

    return NextResponse.json({
      success: true,
      booking: sanitizedBooking,
      comparison,
    });
  } catch (error: any) {
    console.error('[API Handover GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Inspection could not be loaded. Please try again.' }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: 'You are not authorized to record vendor handover inspections.' }, { status: 403 });
    }

    const body = await request.json();

    if (body.handoverType === 'RETURN') {
      const odometer = body.returnOdometerReading ?? body.odometerReading;
      const fuel = body.returnFuelBatteryLevel ?? body.fuelBatteryLevel;
      const scratches = body.returnScratches ?? body.existingScratches ?? [];
      const photos = body.returnPhotos ?? body.photos ?? {};
      const { vehicleId, vendorAgentName, damageDescription = '', remarks = '' } = body;

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
    }

    const {
      vehicleId,
      odometerReading,
      fuelBatteryLevel,
      existingScratches = [],
      photos = {},
      helmetCount = 1,
      accessoriesGiven = [],
      vendorAgentName,
      remarks = '',
    } = body;

    // Required fields check
    const missing: string[] = [];
    if (!vehicleId) missing.push('Vehicle ID');
    if (odometerReading === undefined || odometerReading === null || Number(odometerReading) < 0) missing.push('Odometer reading');
    if (fuelBatteryLevel === undefined || fuelBatteryLevel === null) missing.push('Fuel / Battery level');
    
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Inspection cannot be submitted. Missing: ${missing.join(', ')}` },
        { status: 422 }
      );
    }

    const report = await HandoverService.recordVendorHandover({
      bookingId: id,
      vendorUserId: session.userId,
      vehicleId,
      odometerReading: Number(odometerReading),
      fuelBatteryLevel: Number(fuelBatteryLevel),
      existingScratches,
      photos: {
        frontUrl: photos.frontUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
        backUrl: photos.backUrl || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
        leftUrl: photos.leftUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
        rightUrl: photos.rightUrl || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
        meterUrl: photos.meterUrl || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
        dashboardUrl: photos.dashboardUrl || '',
      },
      helmetCount: Number(helmetCount),
      accessoriesGiven,
      vendorAgentName: vendorAgentName || session.name,
      remarks,
    });

    return NextResponse.json({
      success: true,
      report,
      message: 'Inspection Saved Successfully. Waiting for customer confirmation.',
    });
  } catch (error: any) {
    console.error('[API Handover POST Error]:', error);
    const status = error.message?.includes('Forbidden') ? 403 : error.message?.includes('status') ? 409 : 500;
    return NextResponse.json({ error: error.message || 'Inspection could not be saved. Please try again.' }, { status });
  }
}

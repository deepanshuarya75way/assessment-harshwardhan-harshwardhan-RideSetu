import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vehicle } from '@/models/Vehicle';
import { Coupon } from '@/models/Coupon';
import { PricingService } from '@/services/pricing.service';
import { AvailabilityService } from '@/services/availability.service';
import { getAuthUser } from '@/lib/auth';

async function processPricingCalculation(
  vehicleId: string,
  pickupDateTime: string,
  returnDateTime: string,
  pickupType: string = 'VENDOR_PICKUP',
  couponCode?: string,
  req?: Request
) {
  if (!vehicleId || !pickupDateTime || !returnDateTime) {
    return NextResponse.json({ error: 'Vehicle ID and dates are required' }, { status: 400 });
  }

  await connectToDatabase();
  const vehicle = await Vehicle.findById(vehicleId).lean();
  if (!vehicle) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
  }

  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
      isActive: true,
    }).lean();
  }

  const pricing = PricingService.calculatePricing({
    vehicle: vehicle as any,
    pickupDateTime,
    returnDateTime,
    pickupType,
    coupon: coupon as any,
  });

  const user = req ? await getAuthUser(req as any) : null;
  const serviceability = await AvailabilityService.validateVehicleServiceability({
    vehicleId,
    pickupDateTime,
    returnDateTime,
    excludeUserId: user?.userId,
  });

  if (!serviceability.serviceable) {
    return NextResponse.json({
      success: true,
      pricing,
      available: false,
      serviceable: false,
      code: serviceability.code,
      availabilityReason: serviceability.reason || 'This vehicle is currently unavailable for booking.',
    });
  }

  return NextResponse.json({
    success: true,
    pricing,
    available: serviceability.available,
    serviceable: serviceability.serviceable,
    code: serviceability.code,
    availabilityReason: serviceability.reason || null,
  });
}

export async function POST(request: Request) {
  try {
    const { vehicleId, pickupDateTime, returnDateTime, pickupType = 'VENDOR_PICKUP', couponCode } = await request.json();
    return await processPricingCalculation(vehicleId, pickupDateTime, returnDateTime, pickupType, couponCode, request);
  } catch (error: any) {
    console.error('[API Pricing Calculate Error]:', error);
    return NextResponse.json({ error: error.message || 'Pricing calculation failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId') || '';
    const pickupDateTime = searchParams.get('pickupDateTime') || '';
    const returnDateTime = searchParams.get('returnDateTime') || '';
    const pickupType = searchParams.get('pickupType') || 'VENDOR_PICKUP';
    const couponCode = searchParams.get('couponCode') || undefined;

    return await processPricingCalculation(vehicleId, pickupDateTime, returnDateTime, pickupType, couponCode, request);
  } catch (error: any) {
    console.error('[API Pricing Calculate GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Pricing calculation failed' }, { status: 500 });
  }
}

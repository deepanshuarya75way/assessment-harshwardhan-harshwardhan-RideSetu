import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vehicle } from '@/models/Vehicle';
import { Coupon } from '@/models/Coupon';
import { PricingService } from '@/services/pricing.service';
import { AvailabilityService } from '@/services/availability.service';
import { getAuthUser } from '@/lib/auth';
import { calculateDynamicPrice} from "../../../../services/dynamic-pricing.service";
import Booking from "@/models/Booking";


export async function POST(request : NextRequest){
  try{
    const body = await request.json();
    const{
      basePrice,
      pickupDate,
      demandCount,
    } = body;
    if ( 
      typeof basePrice !== "number" || basePrice <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid base Price",

        },
        {status: 400}
      );
    }
    if(!pickupDate){
      return NextResponse.json(
        {
          success: false,
          message:"pickup date is required" ,
        } {status: 400}
      );
    }
    const result = calculateDynamicPrice({
      basePrice,
      pickupDate,
      demandCount
    });
    return NextResponse.json({
      success: true,
      pricing: result,
    });

  }  catch(error){
    console.error("Dynamic Pricing error :", error);
    return NextResponse.json({
      success: false,
      message: "Unable to calculate dynamic price",
    },{status: 500});
  }
}
export async function processPricingCalculation(
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

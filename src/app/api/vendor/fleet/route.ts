import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vehicle } from '@/models/Vehicle';
import { Vendor } from '@/models/Vendor';
import { Destination } from '@/models/Destination';
import { getSessionFromRequest, assertRole } from '@/lib/auth';
import { AuditLogService } from '@/services/audit.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const auth = assertRole(session, ['VENDOR', 'ADMIN']);
    if (!auth.authorized || !session) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    await connectToDatabase();

    let vendorId = session.vendorId;
    if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId)) {
      const vendor = await Vendor.findOne({ userId: new mongoose.Types.ObjectId(session.userId) });
      if (!vendor) {
        return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
      }
      vendorId = vendor._id.toString();
    }

    const vehicles = await Vehicle.find({ vendorId: new mongoose.Types.ObjectId(vendorId) })
      .populate('destinationId', 'name slug')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      vehicles,
      count: vehicles.length,
    });
  } catch (error: any) {
    console.error('[API Vendor Fleet GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch fleet vehicles' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const auth = assertRole(session, ['VENDOR', 'ADMIN']);
    if (!auth.authorized || !session) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    await connectToDatabase();

    let vendor = null;
    if (session.vendorId && mongoose.Types.ObjectId.isValid(session.vendorId)) {
      vendor = await Vendor.findById(session.vendorId);
    }
    if (!vendor) {
      vendor = await Vendor.findOne({ userId: new mongoose.Types.ObjectId(session.userId) });
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile not found. Please complete onboarding first.' }, { status: 404 });
    }

    const body = await req.json();
    const {
      brand,
      model,
      variant = '',
      category = 'SCOOTER',
      year = new Date().getFullYear(),
      color = 'Black',
      registrationNumber = '',
      odometer = 5000,
      fuelType = 'PETROL',
      transmission = 'MANUAL',
      description = '',
      pricePerDay,
      pricePerHour,
      securityDeposit = 1000,
      deliveryAvailable = true,
      hotelDeliveryAvailable = true,
      hostelDeliveryAvailable = true,
      pickupAvailable = true,
      helmetIncluded = true,
      roadsideAssistance = true,
      images = [],
      photos = {},
      specifications = {},
    } = body;

    // Strict numerical & field validations
    if (!brand || brand.trim().length === 0) {
      return NextResponse.json({ error: 'Vehicle brand is required.' }, { status: 400 });
    }
    if (!model || model.trim().length === 0) {
      return NextResponse.json({ error: 'Vehicle model is required.' }, { status: 400 });
    }

    const parsedPricePerDay = Number(pricePerDay);
    const parsedPricePerHour = Number(pricePerHour);
    const parsedSecurityDeposit = Number(securityDeposit);

    if (isNaN(parsedPricePerDay) || parsedPricePerDay <= 0) {
      return NextResponse.json({ error: 'Daily rental rate must be a valid number greater than 0.' }, { status: 400 });
    }
    if (isNaN(parsedPricePerHour) || parsedPricePerHour <= 0) {
      return NextResponse.json({ error: 'Hourly rental rate must be a valid number greater than 0.' }, { status: 400 });
    }
    if (isNaN(parsedSecurityDeposit) || parsedSecurityDeposit < 0) {
      return NextResponse.json({ error: 'Security deposit must be a valid non-negative number.' }, { status: 400 });
    }

    // Resolve destinationId
    let destinationId = vendor.destinationId;
    if (!destinationId) {
      const dest = await Destination.findOne();
      destinationId = dest?._id;
    }

    const newVehicle = await Vehicle.create({
      vendorId: vendor._id,
      destinationId,
      brand: brand.trim(),
      model: model.trim(),
      variant: variant.trim(),
      category,
      year: Number(year) || new Date().getFullYear(),
      color: color.trim(),
      registrationNumber: registrationNumber.trim().toUpperCase() || `REG-${Date.now()}`,
      odometer: Number(odometer) || 0,
      fuelType,
      transmission,
      description: description.trim(),
      pricePerDay: parsedPricePerDay,
      pricePerHour: parsedPricePerHour,
      securityDeposit: parsedSecurityDeposit,
      securityDepositEnabled: parsedSecurityDeposit > 0,
      securityDepositAmount: parsedSecurityDeposit,
      deliveryAvailable: Boolean(deliveryAvailable),
      hotelDeliveryAvailable: Boolean(hotelDeliveryAvailable),
      hostelDeliveryAvailable: Boolean(hostelDeliveryAvailable),
      pickupAvailable: Boolean(pickupAvailable),
      helmetIncluded: Boolean(helmetIncluded),
      roadsideAssistance: Boolean(roadsideAssistance),
      images: Array.isArray(images) && images.length > 0 ? images : ['/images/vehicles/activa.jpg'],
      photos,
      specifications: {
        engineCc: specifications.engineCc ? Number(specifications.engineCc) : 110,
        seatingCapacity: specifications.seatingCapacity ? Number(specifications.seatingCapacity) : 2,
        ...specifications,
      },
      status: 'APPROVED', // Vendor published
      isAvailable: true,
      isVerified: true,
    });

    await AuditLogService.logVendorAction({
      vendorId: vendor._id.toString(),
      userId: session.userId,
      action: 'VEHICLE_CREATED',
      entityId: newVehicle._id.toString(),
      details: { brand: newVehicle.brand, model: newVehicle.model, pricePerDay: newVehicle.pricePerDay },
    });

    return NextResponse.json({
      success: true,
      vehicle: newVehicle,
      message: 'Vehicle added to fleet successfully.',
    });
  } catch (error: any) {
    console.error('[API Vendor Fleet POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to create vehicle' }, { status: 500 });
  }
}

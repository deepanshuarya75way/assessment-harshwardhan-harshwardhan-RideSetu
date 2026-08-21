import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vehicle } from '@/models/Vehicle';
import { Vendor } from '@/models/Vendor';
import { Booking } from '@/models/Booking';
import { getSessionFromRequest, assertRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(req);
    const auth = assertRole(session, ['VENDOR', 'ADMIN']);
    if (!auth.authorized || !session) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid vehicle ID format' }, { status: 400 });
    }

    await connectToDatabase();

    const vehicle = await Vehicle.findById(id).populate('vendorId destinationId');
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // RBAC: Vendor can only access own vehicles
    if (session.role === 'VENDOR') {
      let vendorId = session.vendorId;
      if (!vendorId) {
        const v = await Vendor.findOne({ userId: session.userId });
        vendorId = v?._id.toString();
      }
      if (vehicle.vendorId._id.toString() !== vendorId) {
        return NextResponse.json({ error: 'Forbidden: You do not own this vehicle.' }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      vehicle,
    });
  } catch (error: any) {
    console.error('[API Vendor Vehicle Details Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch vehicle' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(req);
    const auth = assertRole(session, ['VENDOR', 'ADMIN']);
    if (!auth.authorized || !session) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid vehicle ID format' }, { status: 400 });
    }

    await connectToDatabase();

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // RBAC: Vendor can only modify own vehicles
    if (session.role === 'VENDOR') {
      let vendorId = session.vendorId;
      if (!vendorId) {
        const v = await Vendor.findOne({ userId: session.userId });
        vendorId = v?._id.toString();
      }
      if (vehicle.vendorId.toString() !== vendorId) {
        return NextResponse.json({ error: 'Forbidden: You do not own this vehicle.' }, { status: 403 });
      }
    }

    const body = await req.json();
    const {
      brand,
      model,
      variant,
      category,
      year,
      color,
      registrationNumber,
      odometer,
      fuelType,
      transmission,
      pricePerDay,
      pricePerHour,
      weeklyPrice,
      monthlyPrice,
      securityDeposit,
      securityDepositEnabled,
      securityDepositAmount,
      kmLimitPerDay,
      excessKmCharge,
      deliveryAvailable,
      hotelDeliveryAvailable,
      hostelDeliveryAvailable,
      pickupAvailable,
      lateReturnFeePerHour,
      helmetIncluded,
      roadsideAssistance,
      description,
      status, // Vendor can set 'DRAFT', 'PAUSED', 'MAINTENANCE', 'INACTIVE', or resubmit 'UNDER_REVIEW' / 'APPROVED' (if previously approved)
      isAvailable,
      images,
      photos,
      documents,
      specifications,
    } = body;

    // Guard: Vendor cannot self-approve a brand new vehicle to 'APPROVED' if never approved before
    if (session.role === 'VENDOR' && status === 'APPROVED' && vehicle.status !== 'APPROVED' && vehicle.status !== 'INACTIVE' && vehicle.status !== 'MAINTENANCE') {
      return NextResponse.json(
        { error: 'Forbidden: Vendors cannot directly approve new vehicles. Admin approval required.' },
        { status: 403 }
      );
    }

    if (brand !== undefined) vehicle.brand = brand;
    if (model !== undefined) vehicle.model = model;
    if (variant !== undefined) vehicle.variant = variant;
    if (category !== undefined) vehicle.category = category;
    if (year !== undefined) vehicle.year = Number(year);
    if (color !== undefined) vehicle.color = color;
    if (registrationNumber !== undefined) vehicle.registrationNumber = registrationNumber.toUpperCase().trim();
    if (odometer !== undefined) vehicle.odometer = Number(odometer);
    if (fuelType !== undefined) vehicle.fuelType = fuelType;
    if (transmission !== undefined) vehicle.transmission = transmission;
    if (pricePerDay !== undefined) vehicle.pricePerDay = Number(pricePerDay);
    if (pricePerHour !== undefined) vehicle.pricePerHour = Number(pricePerHour);
    if (weeklyPrice !== undefined) vehicle.weeklyPrice = Number(weeklyPrice);
    if (monthlyPrice !== undefined) vehicle.monthlyPrice = Number(monthlyPrice);

    if (securityDepositEnabled !== undefined) {
      vehicle.securityDepositEnabled = Boolean(securityDepositEnabled);
      if (!vehicle.securityDepositEnabled) {
        vehicle.securityDepositAmount = 0;
        vehicle.securityDeposit = 0;
      } else {
        const amt = Number(securityDepositAmount) || Number(securityDeposit) || vehicle.securityDepositAmount || 1000;
        vehicle.securityDepositAmount = amt;
        vehicle.securityDeposit = amt;
      }
    } else if (securityDeposit !== undefined) {
      vehicle.securityDeposit = Number(securityDeposit);
      vehicle.securityDepositAmount = Number(securityDeposit);
    }

    if (kmLimitPerDay !== undefined) vehicle.kmLimitPerDay = Number(kmLimitPerDay);
    if (excessKmCharge !== undefined) vehicle.excessKmCharge = Number(excessKmCharge);
    if (deliveryAvailable !== undefined) vehicle.deliveryAvailable = Boolean(deliveryAvailable);
    if (hotelDeliveryAvailable !== undefined) vehicle.hotelDeliveryAvailable = Boolean(hotelDeliveryAvailable);
    if (hostelDeliveryAvailable !== undefined) vehicle.hostelDeliveryAvailable = Boolean(hostelDeliveryAvailable);
    if (pickupAvailable !== undefined) vehicle.pickupAvailable = Boolean(pickupAvailable);
    if (lateReturnFeePerHour !== undefined) vehicle.lateReturnFeePerHour = Number(lateReturnFeePerHour);
    if (helmetIncluded !== undefined) vehicle.helmetIncluded = Boolean(helmetIncluded);
    if (roadsideAssistance !== undefined) vehicle.roadsideAssistance = Boolean(roadsideAssistance);
    if (description !== undefined) vehicle.description = description;
    if (Array.isArray(images) && images.length > 0) vehicle.images = images;

    if (photos) {
      vehicle.photos = { ...vehicle.photos, ...photos };
    }
    if (documents) {
      vehicle.documents = { ...vehicle.documents, ...documents };
    }
    if (specifications) {
      vehicle.specifications = { ...vehicle.specifications, ...specifications };
    }

    if (status) {
      if (session.role === 'ADMIN' || ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PAUSED', 'MAINTENANCE', 'INACTIVE'].includes(status)) {
        vehicle.status = status as any;
        if (status === 'MAINTENANCE' || status === 'INACTIVE' || status === 'PAUSED' || status === 'DRAFT' || status === 'UNDER_REVIEW') {
          vehicle.isAvailable = false;
        } else if (status === 'APPROVED') {
          vehicle.isAvailable = true;
          vehicle.isVerified = true;
        }
      }
    }

    if (isAvailable !== undefined && vehicle.status === 'APPROVED') {
      vehicle.isAvailable = Boolean(isAvailable);
    }

    await vehicle.save();

    return NextResponse.json({
      success: true,
      vehicle,
      message: 'Vehicle updated successfully.',
    });
  } catch (error: any) {
    console.error('[API Vendor Vehicle PATCH Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update vehicle' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(req);
    const auth = assertRole(session, ['VENDOR', 'ADMIN']);
    if (!auth.authorized || !session) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid vehicle ID format' }, { status: 400 });
    }

    await connectToDatabase();

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // RBAC: Vendor can only delete own vehicles
    if (session.role === 'VENDOR') {
      let vendorId = session.vendorId;
      if (!vendorId) {
        const v = await Vendor.findOne({ userId: session.userId });
        vendorId = v?._id.toString();
      }
      if (vehicle.vendorId.toString() !== vendorId) {
        return NextResponse.json({ error: 'Forbidden: You do not own this vehicle.' }, { status: 403 });
      }
    }

    // Historical Booking Deactivation Guard
    const hasHistoricalBookings = await Booking.exists({ vehicleId: vehicle._id });

    if (hasHistoricalBookings) {
      vehicle.isAvailable = false;
      vehicle.status = 'INACTIVE';
      await vehicle.save();

      return NextResponse.json({
        success: true,
        deactivated: true,
        message: 'Vehicle has historical booking records and was safely DEACTIVATED to preserve records.',
      });
    }

    await Vehicle.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      deleted: true,
      message: 'Vehicle removed from fleet successfully.',
    });
  } catch (error: any) {
    console.error('[API Vendor Vehicle DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete vehicle' }, { status: 500 });
  }
}

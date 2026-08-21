import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vehicle, VehicleCategory, FuelType, TransmissionType } from '@/models/Vehicle';
import { Vendor } from '@/models/Vendor';
import { Destination } from '@/models/Destination';
import { getSessionFromRequest, assertRole } from '@/lib/auth';

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
    if (!vendorId) {
      const vendor = await Vendor.findOne({ userId: session.userId });
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
    console.error('[API Vendor Vehicles GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch vehicles' }, { status: 500 });
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
    } else if (session.userId) {
      vendor = await Vendor.findOne({ userId: session.userId });
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile not found. Please complete onboarding first.' }, { status: 404 });
    }

    const body = await req.json();
    const {
      _id,
      brand = '',
      model = '',
      variant = '',
      category = 'SCOOTER',
      year = new Date().getFullYear(),
      color = 'Black',
      registrationNumber = '',
      odometer = 5000,
      fuelType = 'PETROL',
      transmission = 'MANUAL',
      description = '',
      pricePerDay = 0,
      pricePerHour = 50,
      weeklyPrice,
      monthlyPrice,
      securityDeposit = 1000,
      securityDepositEnabled = true,
      securityDepositAmount = 1000,
      kmLimitPerDay = 150,
      excessKmCharge = 4,
      deliveryAvailable = true,
      hotelDeliveryAvailable = true,
      hostelDeliveryAvailable = true,
      pickupAvailable = true,
      lateReturnFeePerHour = 100,
      helmetIncluded = true,
      roadsideAssistance = true,
      images = [],
      photos = {},
      documents = {},
      specifications = {},
      status = 'UNDER_REVIEW',
    } = body;

    // Guard: Only VERIFIED vendors can publish live vehicles
    if (status !== 'DRAFT' && vendor.verificationStatus !== 'VERIFIED' && session.role !== 'ADMIN') {
      return NextResponse.json(
        {
          error: `Your partner account is still under review (${vendor.verificationStatus}). Only VERIFIED vendors can publish live vehicles.`,
          currentStatus: vendor.verificationStatus,
        },
        { status: 403 }
      );
    }

    // Required fields check for non-draft publishing
    if (status !== 'DRAFT') {
      if (!brand || !model || !category || !year || !registrationNumber || !pricePerDay || Number(pricePerDay) <= 0) {
        return NextResponse.json(
          { error: 'Brand, Model, Category, Year, Registration Number, and a valid Daily Rental Price are required to publish.' },
          { status: 400 }
        );
      }
      
      const totalPhotos = (Array.isArray(images) ? images.length : 0) + Object.values(photos || {}).filter(Boolean).length;
      if (totalPhotos < 3) {
        return NextResponse.json(
          { error: 'Add at least 3 vehicle photos before publishing.' },
          { status: 400 }
        );
      }
    }

    // Default or resolved destination
    const destinationId = vendor.destinationId || (await Destination.findOne())?._id;

    // Security deposit calculation
    const resolvedDepositEnabled = Boolean(securityDepositEnabled);
    const resolvedDepositAmount = resolvedDepositEnabled ? (Number(securityDepositAmount) || Number(securityDeposit) || 1000) : 0;

    // If _id is passed, update existing draft/vehicle to avoid duplicate creation
    if (_id && mongoose.Types.ObjectId.isValid(_id)) {
      const existingVehicle = await Vehicle.findOne({ _id, vendorId: vendor._id });
      if (existingVehicle) {
        existingVehicle.brand = brand || existingVehicle.brand;
        existingVehicle.model = model || existingVehicle.model;
        existingVehicle.variant = variant;
        existingVehicle.category = (category as VehicleCategory) || existingVehicle.category;
        existingVehicle.year = Number(year) || existingVehicle.year;
        existingVehicle.color = color;
        existingVehicle.registrationNumber = registrationNumber ? registrationNumber.toUpperCase().trim() : existingVehicle.registrationNumber;
        existingVehicle.odometer = Number(odometer);
        existingVehicle.fuelType = fuelType as FuelType;
        existingVehicle.transmission = transmission as TransmissionType;
        existingVehicle.description = description;
        existingVehicle.status = (status as any) || existingVehicle.status;
        existingVehicle.pricePerDay = Number(pricePerDay);
        existingVehicle.pricePerHour = Number(pricePerHour);
        existingVehicle.weeklyPrice = weeklyPrice ? Number(weeklyPrice) : undefined;
        existingVehicle.monthlyPrice = monthlyPrice ? Number(monthlyPrice) : undefined;
        existingVehicle.securityDepositEnabled = resolvedDepositEnabled;
        existingVehicle.securityDepositAmount = resolvedDepositAmount;
        existingVehicle.securityDeposit = resolvedDepositAmount;
        existingVehicle.kmLimitPerDay = Number(kmLimitPerDay);
        existingVehicle.excessKmCharge = Number(excessKmCharge);
        existingVehicle.deliveryAvailable = Boolean(deliveryAvailable);
        existingVehicle.hotelDeliveryAvailable = Boolean(hotelDeliveryAvailable);
        existingVehicle.hostelDeliveryAvailable = Boolean(hostelDeliveryAvailable);
        existingVehicle.pickupAvailable = Boolean(pickupAvailable);
        existingVehicle.lateReturnFeePerHour = Number(lateReturnFeePerHour) || 100;
        existingVehicle.helmetIncluded = Boolean(helmetIncluded);
        existingVehicle.roadsideAssistance = Boolean(roadsideAssistance);
        if (Array.isArray(images) && images.length > 0) existingVehicle.images = images;
        if (photos) existingVehicle.photos = { ...existingVehicle.photos, ...photos };
        if (documents) existingVehicle.documents = { ...existingVehicle.documents, ...documents };
        if (specifications) existingVehicle.specifications = { ...existingVehicle.specifications, ...specifications };

        await existingVehicle.save();
        return NextResponse.json({
          success: true,
          vehicle: existingVehicle,
          message: status === 'DRAFT' ? 'Vehicle draft updated successfully.' : 'Vehicle submitted for review successfully.',
        });
      }
    }

    const newVehicle = await Vehicle.create({
      vendorId: vendor._id,
      destinationId,
      brand: brand || 'Generic',
      model: model || 'Model',
      variant,
      category: category as VehicleCategory,
      year: Number(year) || 2024,
      color,
      registrationNumber: registrationNumber ? registrationNumber.toUpperCase().trim() : `UK07-DRAFT-${Math.floor(1000 + Math.random() * 9000)}`,
      odometer: Number(odometer),
      fuelType: fuelType as FuelType,
      transmission: transmission as TransmissionType,
      description,
      status: status as any,
      isAvailable: status === 'APPROVED',
      isVerified: status === 'APPROVED',
      pricePerDay: Number(pricePerDay),
      pricePerHour: Number(pricePerHour),
      weeklyPrice: weeklyPrice ? Number(weeklyPrice) : undefined,
      monthlyPrice: monthlyPrice ? Number(monthlyPrice) : undefined,
      securityDepositEnabled: resolvedDepositEnabled,
      securityDepositAmount: resolvedDepositAmount,
      securityDeposit: resolvedDepositAmount,
      kmLimitPerDay: Number(kmLimitPerDay),
      excessKmCharge: Number(excessKmCharge),
      deliveryAvailable: Boolean(deliveryAvailable),
      hotelDeliveryAvailable: Boolean(hotelDeliveryAvailable),
      hostelDeliveryAvailable: Boolean(hostelDeliveryAvailable),
      pickupAvailable: Boolean(pickupAvailable),
      lateReturnFeePerHour: Number(lateReturnFeePerHour) || 100,
      helmetIncluded: Boolean(helmetIncluded),
      roadsideAssistance: Boolean(roadsideAssistance),
      images: Array.isArray(images) && images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=800&q=80',
      ],
      photos: {
        front: photos.front || '',
        rear: photos.rear || '',
        left: photos.left || '',
        right: photos.right || '',
        dashboard: photos.dashboard || '',
        odometer: photos.odometer || '',
      },
      documents: {
        rcDocUrl: documents.rcDocUrl || '',
        insuranceDocUrl: documents.insuranceDocUrl || '',
        pucDocUrl: documents.pucDocUrl || '',
        permitDocUrl: documents.permitDocUrl || '',
      },
      specifications: {
        engineCc: specifications.engineCc ? Number(specifications.engineCc) : 150,
        batteryCapacityKwh: specifications.batteryCapacityKwh ? Number(specifications.batteryCapacityKwh) : undefined,
        rangeKm: specifications.rangeKm ? Number(specifications.rangeKm) : undefined,
        topSpeedKmph: specifications.topSpeedKmph ? Number(specifications.topSpeedKmph) : undefined,
        seatingCapacity: specifications.seatingCapacity ? Number(specifications.seatingCapacity) : 2,
        luggageSpace: specifications.luggageSpace || 'Standard',
      },
    });

    return NextResponse.json({
      success: true,
      vehicle: newVehicle,
      message: status === 'DRAFT' ? 'Vehicle draft saved successfully.' : 'Vehicle submitted successfully.',
    });
  } catch (error: any) {
    console.error('[API Vendor Vehicles POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to add vehicle' }, { status: 500 });
  }
}

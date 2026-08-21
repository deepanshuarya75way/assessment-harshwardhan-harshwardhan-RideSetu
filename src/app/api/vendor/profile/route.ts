import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vendor } from '@/models/Vendor';
import { User } from '@/models/User';
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

    let vendor = null;
    if (session.vendorId && mongoose.Types.ObjectId.isValid(session.vendorId)) {
      vendor = await Vendor.findById(session.vendorId).populate('destinationId', 'name slug');
    } else if (session.userId) {
      vendor = await Vendor.findOne({ userId: new mongoose.Types.ObjectId(session.userId) }).populate('destinationId', 'name slug');
    }

    if (!vendor) {
      return NextResponse.json({
        exists: false,
        profile: null,
        onboardingStatus: 'NOT_REGISTERED',
      });
    }

    return NextResponse.json({
      exists: true,
      profile: vendor,
      onboardingStatus: vendor.verificationStatus,
    });
  } catch (error: any) {
    console.error('[API Vendor Profile GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch vendor profile' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const auth = assertRole(session, ['VENDOR', 'ADMIN']);
    if (!auth.authorized || !session) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    await connectToDatabase();
    const userIdObj = new mongoose.Types.ObjectId(session.userId);

    let vendor = null;
    if (session.vendorId && mongoose.Types.ObjectId.isValid(session.vendorId)) {
      vendor = await Vendor.findById(session.vendorId);
    }
    if (!vendor) {
      vendor = await Vendor.findOne({ userId: userIdObj });
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const body = await req.json();

    // Security guard: Vendor CANNOT self-mark status as VERIFIED
    delete body.verificationStatus;
    delete body._id;
    delete body.userId;

    if (body.businessName) vendor.businessName = body.businessName.trim();
    if (body.ownerName) vendor.ownerName = body.ownerName.trim();
    if (body.phone) vendor.phone = body.phone.trim();
    if (body.email) vendor.email = body.email.trim();
    if (body.address) vendor.address = body.address.trim();
    if (body.city) vendor.city = body.city.trim();
    if (body.state) vendor.state = body.state.trim();
    if (body.pincode !== undefined) vendor.pincode = body.pincode.trim();
    if (body.businessDescription !== undefined) vendor.businessDescription = body.businessDescription.trim();
    if (body.operatingHours) vendor.operatingHours = { ...vendor.operatingHours, ...body.operatingHours };
    if (body.deliveryRadiusKm !== undefined) vendor.deliveryRadiusKm = Math.max(1, Number(body.deliveryRadiusKm) || 15);
    if (body.baseDeliveryFee !== undefined) vendor.baseDeliveryFee = Math.max(0, Number(body.baseDeliveryFee) || 0);

    if (body.hubPickupAvailable !== undefined) vendor.hubPickupAvailable = Boolean(body.hubPickupAvailable);
    if (body.doorstepDeliveryAvailable !== undefined) vendor.doorstepDeliveryAvailable = Boolean(body.doorstepDeliveryAvailable);
    if (body.hostelDeliveryAvailable !== undefined) vendor.hostelDeliveryAvailable = Boolean(body.hostelDeliveryAvailable);

    await vendor.save();

    await AuditLogService.logVendorAction({
      vendorId: vendor._id.toString(),
      userId: session.userId,
      action: 'BUSINESS_PROFILE_UPDATED',
      details: { businessName: vendor.businessName, city: vendor.city },
    });

    return NextResponse.json({
      success: true,
      profile: vendor,
      message: 'Business profile updated successfully.',
    });
  } catch (error: any) {
    console.error('[API Vendor Profile PATCH Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update vendor profile' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return PATCH(req);
}

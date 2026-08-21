import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vehicle } from '@/models/Vehicle';
import { Vendor } from '@/models/Vendor';
import { getSessionFromRequest, assertRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function resolveVendorId(session: any): Promise<string | null> {
  if (session.vendorId && mongoose.Types.ObjectId.isValid(session.vendorId)) {
    return session.vendorId;
  }
  if (session.userId) {
    const vendor = await Vendor.findOne({ userId: new mongoose.Types.ObjectId(session.userId) });
    if (vendor) return vendor._id.toString();
  }
  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  try {
    const session = getSessionFromRequest(req);
    const auth = assertRole(session, ['VENDOR', 'ADMIN']);
    if (!auth.authorized || !session) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    await connectToDatabase();
    const vendorId = await resolveVendorId(session);
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const { vehicleId } = params;
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return NextResponse.json({ error: 'Invalid vehicle ID' }, { status: 400 });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Tenant Isolation
    if (vehicle.vendorId.toString() !== vendorId) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this vehicle' }, { status: 403 });
    }

    const body = await req.json();
    const { angle = 'primary', imageUrl, photoBase64, mimeType } = body;

    // MIME type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (mimeType && !allowedTypes.includes(mimeType.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPG, JPEG, PNG, and WEBP image formats are supported.' },
        { status: 400 }
      );
    }

    // File size validation (<= 5MB)
    if (photoBase64 && photoBase64.length > 5 * 1024 * 1024 * 1.37) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 5MB.' },
        { status: 400 }
      );
    }

    const finalUrl = imageUrl || (photoBase64 ? `data:${mimeType || 'image/jpeg'};base64,${photoBase64.slice(0, 100)}...` : `/uploads/vehicles/${vehicleId}_${angle}.jpg`);

    if (!vehicle.photos) {
      vehicle.photos = {};
    }

    if (angle === 'front') vehicle.photos.front = finalUrl;
    else if (angle === 'rear') vehicle.photos.rear = finalUrl;
    else if (angle === 'left') vehicle.photos.left = finalUrl;
    else if (angle === 'right') vehicle.photos.right = finalUrl;
    else if (angle === 'dashboard') vehicle.photos.dashboard = finalUrl;
    else {
      // Primary
      if (!vehicle.images.includes(finalUrl)) {
        vehicle.images.unshift(finalUrl);
      }
    }

    await vehicle.save();

    return NextResponse.json({
      success: true,
      photos: vehicle.photos,
      images: vehicle.images,
      message: `Vehicle ${angle} image updated successfully.`,
    });
  } catch (error: any) {
    console.error('[API Vendor Fleet Images POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload vehicle image' }, { status: 500 });
  }
}

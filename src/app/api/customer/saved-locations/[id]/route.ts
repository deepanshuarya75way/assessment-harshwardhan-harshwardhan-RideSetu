import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { CustomerSavedLocation } from '@/models/CustomerSavedLocation';
import { getSessionFromRequest } from '@/lib/auth';
import { validateCoordinates } from '@/lib/encryption';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid location ID format' }, { status: 400 });
    }

    await connectToDatabase();

    // Enforce ownership: only owner can edit their saved location
    const location = await CustomerSavedLocation.findOne({
      _id: new mongoose.Types.ObjectId(id),
      customerId: new mongoose.Types.ObjectId(session.userId),
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Saved location not found or unauthorized' },
        { status: 404 }
      );
    }

    const body = await request.json();

    if (body.latitude !== undefined && body.longitude !== undefined) {
      const coordCheck = validateCoordinates(body.latitude, body.longitude);
      if (!coordCheck.isValid) {
        return NextResponse.json({ error: coordCheck.error }, { status: 400 });
      }
      location.latitude = coordCheck.lat!;
      location.longitude = coordCheck.lng!;
    }

    if (body.label) location.label = body.label.trim();
    if (body.locationType) location.locationType = body.locationType;
    if (body.address) location.address = body.address.trim();
    if (body.houseOrRoom !== undefined) location.houseOrRoom = body.houseOrRoom.trim();
    if (body.buildingName !== undefined) location.buildingName = body.buildingName.trim();
    if (body.landmark !== undefined) location.landmark = body.landmark.trim();
    if (body.city) location.city = body.city.trim();
    if (body.state) location.state = body.state.trim();
    if (body.pincode !== undefined) location.pincode = body.pincode.trim();
    if (body.contactName !== undefined) location.contactName = body.contactName.trim();
    if (body.contactPhone !== undefined) location.contactPhone = body.contactPhone.trim();
    if (body.deliveryInstructions !== undefined) location.deliveryInstructions = body.deliveryInstructions.trim();

    if (body.isDefault) {
      await CustomerSavedLocation.updateMany(
        { customerId: new mongoose.Types.ObjectId(session.userId) },
        { $set: { isDefault: false } }
      );
      location.isDefault = true;
    }

    await location.save();

    return NextResponse.json({
      success: true,
      location,
      message: 'Saved location updated successfully.',
    });
  } catch (error: any) {
    console.error('[API Saved Locations PUT Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update saved location' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid location ID format' }, { status: 400 });
    }

    await connectToDatabase();

    // Enforce ownership: only owner can delete their saved location
    const deleted = await CustomerSavedLocation.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      customerId: new mongoose.Types.ObjectId(session.userId),
    });

    if (!deleted) {
      return NextResponse.json(
        { error: 'Saved location not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Saved location deleted successfully.',
    });
  } catch (error: any) {
    console.error('[API Saved Locations DELETE Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete saved location' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { CustomerSavedLocation } from '@/models/CustomerSavedLocation';
import { getSessionFromRequest, assertRole } from '@/lib/auth';
import { validateCoordinates } from '@/lib/encryption';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();

    // Customer can access only their own saved locations (RBAC)
    const locations = await CustomerSavedLocation.find({
      customerId: new mongoose.Types.ObjectId(session.userId),
    })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ locations });
  } catch (error: any) {
    console.error('[API Saved Locations GET Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch saved locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      label,
      locationType = 'DOORSTEP',
      locationSource = 'MANUAL',
      address,
      houseOrRoom = '',
      buildingName = '',
      landmark = '',
      city,
      state = 'Uttarakhand',
      country = 'India',
      pincode = '',
      latitude,
      longitude,
      placeId = '',
      formattedAddress = '',
      contactName = '',
      contactPhone = '',
      deliveryInstructions = '',
      isDefault = false,
    } = body;

    if (!label || !address || !city) {
      return NextResponse.json(
        { error: 'Label, address, and city are required.' },
        { status: 400 }
      );
    }

    // Strict server-side coordinate validation
    const coordCheck = validateCoordinates(latitude, longitude);
    if (!coordCheck.isValid) {
      return NextResponse.json({ error: coordCheck.error }, { status: 400 });
    }

    await connectToDatabase();

    const customerId = new mongoose.Types.ObjectId(session.userId);

    // If marked default, unset existing default locations for this customer
    if (isDefault) {
      await CustomerSavedLocation.updateMany({ customerId }, { $set: { isDefault: false } });
    }

    const newLocation = await CustomerSavedLocation.create({
      customerId,
      label: label.trim(),
      locationType,
      locationSource,
      address: address.trim(),
      houseOrRoom: houseOrRoom.trim(),
      buildingName: buildingName.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      pincode: pincode.trim(),
      latitude: coordCheck.lat,
      longitude: coordCheck.lng,
      placeId: placeId.trim(),
      contactName: contactName.trim() || session.name || '',
      contactPhone: contactPhone.trim() || '',
      deliveryInstructions: deliveryInstructions.trim(),
      isDefault: Boolean(isDefault),
    });

    return NextResponse.json(
      {
        success: true,
        location: newLocation,
        message: 'Delivery location saved successfully.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API Saved Locations POST Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save delivery location' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Destination } from '@/models/Destination';
import { PickupLocation } from '@/models/PickupLocation';
import { Vendor } from '@/models/Vendor';
import { Vehicle } from '@/models/Vehicle';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    await connectToDatabase();

    const destination = await Destination.findOne({ slug: slug.toLowerCase(), isActive: true }).lean();
    if (!destination) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 404 });
    }

    const [pickupLocations, vendors, featuredVehicles] = await Promise.all([
      PickupLocation.find({ destinationId: destination._id }).lean(),
      Vendor.find({ destinationId: destination._id, verificationStatus: 'VERIFIED' }).sort({ rating: -1 }).limit(6).lean(),
      Vehicle.find({ destinationId: destination._id, isAvailable: true, isVerified: true })
        .populate('vendorId', 'businessName rating totalReviews isTopRated')
        .sort({ rating: -1 })
        .limit(8)
        .lean(),
    ]);

    return NextResponse.json({
      destination,
      pickupLocations,
      vendors,
      featuredVehicles,
    });
  } catch (error: any) {
    console.error('[API Destination Slug Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch destination details' }, { status: 500 });
  }
}

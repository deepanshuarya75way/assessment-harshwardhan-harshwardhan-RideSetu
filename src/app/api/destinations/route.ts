import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Destination } from '@/models/Destination';
import { Vehicle } from '@/models/Vehicle';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const destinations = await Destination.find({ isActive: true }).sort({ name: 1 }).lean();

    // Enrich with dynamic available vehicle counts
    const enriched = await Promise.all(
      destinations.map(async (dest) => {
        const vehicleCount = await Vehicle.countDocuments({
          destinationId: dest._id,
          isAvailable: true,
          isVerified: true,
        });
        return {
          ...dest,
          totalVehicles: vehicleCount,
        };
      })
    );

    return NextResponse.json({ destinations: enriched });
  } catch (error: any) {
    console.error('[API Destinations Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch destinations' }, { status: 500 });
  }
}

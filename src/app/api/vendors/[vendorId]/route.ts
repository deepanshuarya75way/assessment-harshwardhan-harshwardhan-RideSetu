import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Vendor } from '@/models/Vendor';
import { Vehicle } from '@/models/Vehicle';
import { Booking } from '@/models/Booking';
import { ReservationLock } from '@/models/ReservationLock';
import { getVehicleImage, getVehicleAltText } from '@/config/vehicle-images';

const FALLBACK_VENDORS: Record<string, any> = {
  '65e000000000000000000010': {
    _id: '65e000000000000000000010',
    businessName: 'Himalayan Travel Mobility Hub',
    ownerName: 'Vikram Singh',
    email: 'vendor@ridesetu.demo',
    phone: '+919876543211',
    address: 'Tapovan Badrinath Road, Rishikesh',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    rating: 4.9,
    totalReviews: 86,
    deliveryRadiusKm: 20,
    baseDeliveryFee: 100,
    operatingHours: { open: '08:00 AM', close: '09:00 PM', days: 'Mon - Sun' },
    verificationStatus: 'VERIFIED',
    businessDescription: 'Verified RideSetu Fleet Partner in Rishikesh',
  },
  '65e000000000000000000011': {
    _id: '65e000000000000000000011',
    businessName: 'Mussoorie Hills Ride Station',
    ownerName: 'Amit Sharma',
    email: 'mussoorie@ridesetu.demo',
    phone: '+919876543213',
    address: 'Mall Road, Mussoorie',
    city: 'Mussoorie',
    state: 'Uttarakhand',
    rating: 4.8,
    totalReviews: 54,
    deliveryRadiusKm: 15,
    baseDeliveryFee: 150,
    operatingHours: { open: '08:00 AM', close: '09:00 PM', days: 'Mon - Sun' },
    verificationStatus: 'VERIFIED',
    businessDescription: 'Verified RideSetu Fleet Partner in Mussoorie',
  },
  '65e000000000000000000012': {
    _id: '65e000000000000000000012',
    businessName: 'Dehradun Airport Express Mobility',
    ownerName: 'Rajesh Verma',
    email: 'dehradun@ridesetu.demo',
    phone: '+919876543214',
    address: 'Jolly Grant Airport Road, Dehradun',
    city: 'Dehradun',
    state: 'Uttarakhand',
    rating: 4.9,
    totalReviews: 112,
    deliveryRadiusKm: 30,
    baseDeliveryFee: 200,
    operatingHours: { open: '08:00 AM', close: '09:00 PM', days: 'Mon - Sun' },
    verificationStatus: 'VERIFIED',
    businessDescription: 'Verified RideSetu Fleet Partner in Dehradun',
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const { vendorId } = params;
    const searchParams = request.nextUrl.searchParams;

    const pickupDateTime = searchParams.get('pickupDateTime');
    const returnDateTime = searchParams.get('returnDateTime');

    const now = new Date();
    const pickup = pickupDateTime ? new Date(pickupDateTime) : new Date(now.getTime() + 2 * 3600 * 1000);
    const returnDt = returnDateTime ? new Date(returnDateTime) : new Date(pickup.getTime() + 48 * 3600 * 1000);

    const db = await connectToDatabase();

    let vendor: any = null;
    let vehicles: any[] = [];
    let unavailableVehicleIds = new Set<string>();

    if (db) {
      try {
        vendor = await Vendor.findById(vendorId).lean();
        if (!vendor && /^[0-9a-fA-F]{24}$/.test(vendorId)) {
          vendor = await Vendor.findOne({ _id: vendorId }).lean();
        }

        if (vendor) {
          const overlappingBookings = await Booking.find({
            status: { $in: ['CONFIRMED', 'ACTIVE', 'PAID', 'ONGOING', 'PENDING'] },
            startDate: { $lt: returnDt },
            endDate: { $gt: pickup },
          }).distinct('vehicleId');

          const activeLocks = await ReservationLock.find({
            expiresAt: { $gt: now },
            startTime: { $lt: returnDt },
            endTime: { $gt: pickup },
          }).distinct('vehicleId');

          unavailableVehicleIds = new Set([
            ...overlappingBookings.map((id) => id.toString()),
            ...activeLocks.map((id) => id.toString()),
          ]);

          vehicles = await Vehicle.find({
            vendorId: vendor._id,
            status: 'APPROVED',
          })
            .sort({ pricePerDay: 1 })
            .lean();
        }
      } catch (err) {
        console.warn('[API Vendor Details] DB Query warning:', err);
      }
    }

    if (!vendor) {
      vendor = FALLBACK_VENDORS[vendorId] || FALLBACK_VENDORS['65e000000000000000000010'];
    }

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor profile not found.' },
        { status: 404 }
      );
    }

    if (vehicles.length === 0 && db) {
      try {
        vehicles = await Vehicle.find({ status: 'APPROVED' }).limit(10).lean();
      } catch (e) {
        console.warn('[API Vendor Details] Vehicle fallback warning:', e);
      }
    }

    const enrichedVehicles = vehicles.map((v) => {
      const isReserved = unavailableVehicleIds.has(v._id.toString());
      const displayImg = getVehicleImage({
        brand: v.brand,
        model: v.model,
        variant: v.variant,
        category: v.category,
        images: v.images,
      });
      const altText = getVehicleAltText({
        brand: v.brand,
        model: v.model,
        category: v.category,
      });

      return {
        ...v,
        imageUrl: displayImg,
        imageAlt: altText,
        isCurrentlyAvailable: v.isAvailable && !isReserved,
        reservationConflict: isReserved,
      };
    });

    return NextResponse.json({
      success: true,
      vendor: {
        _id: vendor._id,
        businessName: vendor.businessName,
        ownerName: vendor.ownerName,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        city: vendor.city,
        state: vendor.state || 'Uttarakhand',
        rating: vendor.rating || 4.8,
        totalReviews: vendor.totalReviews || 24,
        deliveryRadiusKm: vendor.deliveryRadiusKm || 15,
        baseDeliveryFee: vendor.baseDeliveryFee || 100,
        operatingHours: vendor.operatingHours || { open: '08:00 AM', close: '09:00 PM', days: 'Mon - Sun' },
        verificationStatus: vendor.verificationStatus,
        businessDescription: vendor.businessDescription || 'Verified RideSetu Fleet Partner',
        documents: vendor.documents,
      },
      vehicles: enrichedVehicles,
      schedule: {
        pickupDateTime: pickup.toISOString(),
        returnDateTime: returnDt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[API Vendor Details Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch vendor storefront details.' },
      { status: 500 }
    );
  }
}
